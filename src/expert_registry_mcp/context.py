"""Context management for expert knowledge injection."""

import re
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime
import aiofiles
from cachetools import LRUCache

from .models import Expert, ExpertContext


class ContextManager:
    """Manage expert context loading and injection."""
    
    def __init__(self, contexts_path: Path, cache_size: int = 50):
        self.contexts_path = contexts_path
        self.cache = LRUCache(maxsize=cache_size)
        
    async def load_context(
        self,
        expert_id: str,
        sections: Optional[List[str]] = None
    ) -> ExpertContext:
        """Load expert context from markdown file."""
        # Check cache
        cache_key = f"{expert_id}:{sections}"
        if cache_key in self.cache:
            return self.cache[cache_key]
            
        # Load from file
        context_path = self.contexts_path / f"{expert_id}.md"
        
        if not context_path.exists():
            raise FileNotFoundError(f"Context file not found for expert: {expert_id}")
            
        async with aiofiles.open(context_path, 'r') as f:
            content = await f.read()
            
        # Parse sections if requested
        sections_dict = {}
        if sections:
            sections_dict = self._parse_sections(content, sections)
            
        context = ExpertContext(
            expert_id=expert_id,
            content=content,
            sections=sections_dict,
            loaded_at=datetime.now()
        )
        
        # Cache the result
        self.cache[cache_key] = context
        
        return context
        
    def _parse_sections(self, content: str, sections: List[str]) -> Dict[str, str]:
        """Parse specific sections from markdown content."""
        sections_dict = {}
        lines = content.split('\n')
        
        current_section = None
        section_content = []
        
        for line in lines:
            # Check if this is a section header
            if line.startswith('#'):
                # Save previous section if it was requested
                if current_section and current_section in sections:
                    sections_dict[current_section] = '\n'.join(section_content).strip()
                    
                # Extract section name
                header_match = re.match(r'^#+\s+(.+)$', line)
                if header_match:
                    current_section = header_match.group(1).strip()
                    section_content = []
            else:
                section_content.append(line)
                
        # Save last section
        if current_section and current_section in sections:
            sections_dict[current_section] = '\n'.join(section_content).strip()
            
        return sections_dict
        
    async def inject_context(
        self,
        prompt: str,
        expert_id: str,
        injection_points: Optional[List[str]] = None
    ) -> str:
        """Inject expert context into a prompt."""
        # Load context
        context = await self.load_context(expert_id)
        
        if not injection_points:
            # Default injection: prepend entire context
            return self._default_injection(prompt, context)
            
        # Custom injection based on points
        enhanced_prompt = prompt
        
        for point in injection_points:
            if point == "constraints":
                enhanced_prompt = self._inject_constraints(enhanced_prompt, context)
            elif point == "patterns":
                enhanced_prompt = self._inject_patterns(enhanced_prompt, context)
            elif point == "quality-criteria":
                enhanced_prompt = self._inject_quality_criteria(enhanced_prompt, context)
            elif point == "full":
                enhanced_prompt = self._default_injection(enhanced_prompt, context)
                
        return enhanced_prompt
        
    def _default_injection(self, prompt: str, context: ExpertContext) -> str:
        """Default injection strategy - prepend full context."""
        return f"""## Expert Context: {context.expert_id}

{context.content}

## Task Instructions

{prompt}"""

    def _inject_constraints(self, prompt: str, context: ExpertContext) -> str:
        """Inject constraints section."""
        constraints = self._extract_section(context.content, "Constraints")
        if not constraints:
            return prompt
            
        # Find where to inject (before task description or at end)
        if "## Task" in prompt:
            parts = prompt.split("## Task", 1)
            return f"{parts[0]}## Expert Constraints\n\n{constraints}\n\n## Task{parts[1]}"
        else:
            return f"{prompt}\n\n## Expert Constraints\n\n{constraints}"
            
    def _inject_patterns(self, prompt: str, context: ExpertContext) -> str:
        """Inject patterns section."""
        patterns = self._extract_section(context.content, "Patterns")
        if not patterns:
            return prompt
            
        if "## Implementation" in prompt:
            parts = prompt.split("## Implementation", 1)
            return f"{parts[0]}## Expert Patterns\n\n{patterns}\n\n## Implementation{parts[1]}"
        else:
            return f"{prompt}\n\n## Expert Patterns\n\n{patterns}"
            
    def _inject_quality_criteria(self, prompt: str, context: ExpertContext) -> str:
        """Inject quality criteria section."""
        quality = self._extract_section(context.content, "Quality Standards")
        if not quality:
            return prompt
            
        return f"{prompt}\n\n## Expert Quality Standards\n\n{quality}"
        
    def _extract_section(self, content: str, section_name: str) -> Optional[str]:
        """Extract a specific section from markdown content."""
        lines = content.split('\n')
        in_section = False
        section_lines = []
        section_level = 0
        
        for line in lines:
            if line.startswith('#'):
                header_match = re.match(r'^(#+)\s+(.+)$', line)
                if header_match:
                    level = len(header_match.group(1))
                    title = header_match.group(2).strip()
                    
                    if title == section_name:
                        in_section = True
                        section_level = level
                    elif in_section and level <= section_level:
                        # End of section
                        break
                        
            elif in_section:
                section_lines.append(line)
                
        return '\n'.join(section_lines).strip() if section_lines else None
        
    async def validate_context_file(self, expert_id: str) -> bool:
        """Validate that a context file exists and is readable."""
        context_path = self.contexts_path / f"{expert_id}.md"
        
        if not context_path.exists():
            return False
            
        try:
            async with aiofiles.open(context_path, 'r') as f:
                content = await f.read()
                return len(content) > 0
        except Exception:
            return False
            
    async def list_available_contexts(self) -> List[str]:
        """List all available expert context files."""
        if not self.contexts_path.exists():
            return []
            
        contexts = []
        for file_path in self.contexts_path.glob("*.md"):
            expert_id = file_path.stem
            contexts.append(expert_id)
            
        return sorted(contexts)
        
    def clear_cache(self):
        """Clear the context cache."""
        self.cache.clear()
        
    async def get_context_metadata(self, expert_id: str) -> Dict:
        """Get metadata about a context file."""
        context_path = self.contexts_path / f"{expert_id}.md"
        
        if not context_path.exists():
            raise FileNotFoundError(f"Context file not found for expert: {expert_id}")
            
        stat = context_path.stat()
        
        # Count sections
        async with aiofiles.open(context_path, 'r') as f:
            content = await f.read()
            
        sections = []
        for line in content.split('\n'):
            if line.startswith('#'):
                header_match = re.match(r'^#+\s+(.+)$', line)
                if header_match:
                    sections.append(header_match.group(1).strip())
                    
        return {
            "expert_id": expert_id,
            "file_size": stat.st_size,
            "modified_at": datetime.fromtimestamp(stat.st_mtime),
            "sections": sections,
            "line_count": len(content.split('\n'))
        }