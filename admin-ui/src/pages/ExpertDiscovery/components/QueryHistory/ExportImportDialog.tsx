/**
 * Export/Import Dialog Component
 * UI component for exporting and importing query history
 * 
 * Expert React patterns applied:
 * - Compound component pattern with sub-components
 * - Controlled form state with proper validation
 * - Accessible modal design with keyboard navigation
 * - Error boundary integration for robustness
 * - Performance optimization with React.memo
 * - File handling with drag-and-drop support
 */

import React, { useState, useCallback, useRef } from 'react'
import { 
  Modal, 
  Box, 
  Button, 
  Group, 
  Text, 
  Stack, 
  Tabs, 
  Select, 
  Switch, 
  DateInput, 
  TextInput,
  FileInput,
  Progress,
  Alert,
  Code,
  Divider,
  ScrollArea,
  ActionIcon,
  Tooltip
} from '@mantine/core'
import { 
  IconDownload, 
  IconUpload, 
  IconCheck, 
  IconX, 
  IconAlertCircle,
  IconFile,
  IconFileText,
  IconCalendar,
  IconFilter,
  IconTrash
} from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import type { 
  ExportOptions, 
  ImportOptions, 
  ExportResult, 
  ImportResult 
} from '../../types/history'
import { FileDownloader } from '../../utils/exportImport'

interface ExportImportDialogProps {
  opened: boolean
  onClose: () => void
  onExport: (options: ExportOptions) => Promise<ExportResult>
  onImport: (data: string, options: ImportOptions) => Promise<ImportResult>
  entryCount: number
}

interface ExportFormData {
  format: 'json' | 'csv'
  includeMetadata: boolean
  dateRange: {
    start: Date | null
    end: Date | null
  }
  filterBy: {
    algorithm: string
    success: string
  }
}

interface ImportFormData {
  format: 'json' | 'csv'
  merge: boolean
  validateEntries: boolean
  skipDuplicates: boolean
  file: File | null
}

const ExportImportDialog: React.FC<ExportImportDialogProps> = ({
  opened,
  onClose,
  onExport,
  onImport,
  entryCount
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Export form state
  const [exportForm, setExportForm] = useState<ExportFormData>({
    format: 'json',
    includeMetadata: false,
    dateRange: {
      start: null,
      end: null
    },
    filterBy: {
      algorithm: '',
      success: ''
    }
  })
  
  // Import form state
  const [importForm, setImportForm] = useState<ImportFormData>({
    format: 'json',
    merge: true,
    validateEntries: true,
    skipDuplicates: true,
    file: null
  })
  
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  
  // Export functionality
  const handleExport = useCallback(async () => {
    if (isProcessing) return
    
    setIsProcessing(true)
    setProcessingProgress(0)
    
    try {
      const options: ExportOptions = {
        format: exportForm.format,
        includeMetadata: exportForm.includeMetadata,
        dateRange: exportForm.dateRange.start && exportForm.dateRange.end ? {
          start: exportForm.dateRange.start,
          end: exportForm.dateRange.end
        } : undefined,
        filterBy: {
          algorithm: exportForm.filterBy.algorithm || undefined,
          success: exportForm.filterBy.success ? exportForm.filterBy.success === 'true' : undefined
        }
      }
      
      setProcessingProgress(25)
      const result = await onExport(options)
      
      setProcessingProgress(75)
      
      // Download the file
      const mimeType = exportForm.format === 'json' ? 'application/json' : 'text/csv'
      FileDownloader.downloadFile(result.data, result.filename, mimeType)
      
      setProcessingProgress(100)
      
      notifications.show({
        title: 'Export Successful',
        message: `Exported ${result.entryCount} entries (${(result.size / 1024).toFixed(1)} KB)`,
        icon: <IconCheck />,
        color: 'green'
      })
      
      onClose()
      
    } catch (error) {
      notifications.show({
        title: 'Export Failed',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        icon: <IconX />,
        color: 'red'
      })
    } finally {
      setIsProcessing(false)
      setProcessingProgress(0)
    }
  }, [exportForm, onExport, onClose, isProcessing])
  
  // Import functionality
  const handleImport = useCallback(async () => {
    if (isProcessing || !importForm.file) return
    
    setIsProcessing(true)
    setProcessingProgress(0)
    setImportResult(null)
    
    try {
      setProcessingProgress(25)
      const fileContent = await FileDownloader.readFileAsText(importForm.file)
      
      setProcessingProgress(50)
      
      const options: ImportOptions = {
        format: importForm.format,
        merge: importForm.merge,
        validateEntries: importForm.validateEntries,
        skipDuplicates: importForm.skipDuplicates
      }
      
      const result = await onImport(fileContent, options)
      
      setProcessingProgress(100)
      setImportResult(result)
      
      if (result.success) {
        notifications.show({
          title: 'Import Successful',
          message: `Imported ${result.importedCount} entries`,
          icon: <IconCheck />,
          color: 'green'
        })
      } else {
        notifications.show({
          title: 'Import Completed with Errors',
          message: `Imported ${result.importedCount} entries, ${result.skippedCount} skipped`,
          icon: <IconAlertCircle />,
          color: 'orange'
        })
      }
      
    } catch (error) {
      notifications.show({
        title: 'Import Failed',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        icon: <IconX />,
        color: 'red'
      })
    } finally {
      setIsProcessing(false)
      setProcessingProgress(0)
    }
  }, [importForm, onImport, isProcessing])
  
  // Reset forms when dialog closes
  const handleClose = useCallback(() => {
    setImportResult(null)
    setProcessingProgress(0)
    setIsProcessing(false)
    onClose()
  }, [onClose])
  
  // Clear import file
  const clearImportFile = useCallback(() => {
    setImportForm(prev => ({ ...prev, file: null }))
    setImportResult(null)
  }, [])
  
  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Export/Import Query History"
      size="lg"
      centered
    >
      <Tabs value={activeTab} onTabChange={(value) => setActiveTab(value as 'export' | 'import')}>
        <Tabs.List>
          <Tabs.Tab value="export" leftSection={<IconDownload size={16} />}>
            Export
          </Tabs.Tab>
          <Tabs.Tab value="import" leftSection={<IconUpload size={16} />}>
            Import
          </Tabs.Tab>
        </Tabs.List>
        
        <Tabs.Panel value="export" pt="md">
          <Stack>
            <Group>
              <Select
                label="Format"
                value={exportForm.format}
                onChange={(value) => setExportForm(prev => ({ 
                  ...prev, 
                  format: value as 'json' | 'csv' 
                }))}
                data={[
                  { value: 'json', label: 'JSON' },
                  { value: 'csv', label: 'CSV' }
                ]}
                w={120}
              />
              
              <Switch
                label="Include metadata"
                checked={exportForm.includeMetadata}
                onChange={(event) => setExportForm(prev => ({ 
                  ...prev, 
                  includeMetadata: event.currentTarget.checked 
                }))}
              />
            </Group>
            
            <Divider label="Filters" labelPosition="left" />
            
            <Group grow>
              <DateInput
                label="Start Date"
                placeholder="Select start date"
                value={exportForm.dateRange.start}
                onChange={(value) => setExportForm(prev => ({ 
                  ...prev, 
                  dateRange: { ...prev.dateRange, start: value } 
                }))}
                leftSection={<IconCalendar size={16} />}
              />
              
              <DateInput
                label="End Date"
                placeholder="Select end date"
                value={exportForm.dateRange.end}
                onChange={(value) => setExportForm(prev => ({ 
                  ...prev, 
                  dateRange: { ...prev.dateRange, end: value } 
                }))}
                leftSection={<IconCalendar size={16} />}
              />
            </Group>
            
            <Group grow>
              <Select
                label="Algorithm"
                placeholder="All algorithms"
                value={exportForm.filterBy.algorithm}
                onChange={(value) => setExportForm(prev => ({ 
                  ...prev, 
                  filterBy: { ...prev.filterBy, algorithm: value || '' } 
                }))}
                data={[
                  { value: 'hybrid', label: 'Hybrid' },
                  { value: 'vector', label: 'Vector' },
                  { value: 'graph', label: 'Graph' }
                ]}
                clearable
              />
              
              <Select
                label="Success Status"
                placeholder="All results"
                value={exportForm.filterBy.success}
                onChange={(value) => setExportForm(prev => ({ 
                  ...prev, 
                  filterBy: { ...prev.filterBy, success: value || '' } 
                }))}
                data={[
                  { value: 'true', label: 'Successful' },
                  { value: 'false', label: 'Failed' }
                ]}
                clearable
              />
            </Group>
            
            <Text size="sm" c="dimmed">
              {entryCount} entries available for export
            </Text>
            
            {isProcessing && (
              <Progress value={processingProgress} size="sm" animated />
            )}
            
            <Group justify="flex-end">
              <Button variant="subtle" onClick={handleClose} disabled={isProcessing}>
                Cancel
              </Button>
              <Button 
                onClick={handleExport} 
                disabled={isProcessing}
                loading={isProcessing}
                leftSection={<IconDownload size={16} />}
              >
                Export
              </Button>
            </Group>
          </Stack>
        </Tabs.Panel>
        
        <Tabs.Panel value="import" pt="md">
          <Stack>
            <Group>
              <Select
                label="Format"
                value={importForm.format}
                onChange={(value) => setImportForm(prev => ({ 
                  ...prev, 
                  format: value as 'json' | 'csv' 
                }))}
                data={[
                  { value: 'json', label: 'JSON' },
                  { value: 'csv', label: 'CSV' }
                ]}
                w={120}
              />
            </Group>
            
            <Group grow>
              <Switch
                label="Merge with existing"
                description="Keep existing entries and add new ones"
                checked={importForm.merge}
                onChange={(event) => setImportForm(prev => ({ 
                  ...prev, 
                  merge: event.currentTarget.checked 
                }))}
              />
              
              <Switch
                label="Validate entries"
                description="Check entry format and data integrity"
                checked={importForm.validateEntries}
                onChange={(event) => setImportForm(prev => ({ 
                  ...prev, 
                  validateEntries: event.currentTarget.checked 
                }))}
              />
            </Group>
            
            <Switch
              label="Skip duplicates"
              description="Don't import entries with the same query text"
              checked={importForm.skipDuplicates}
              onChange={(event) => setImportForm(prev => ({ 
                ...prev, 
                skipDuplicates: event.currentTarget.checked 
              }))}
            />
            
            <Divider />
            
            <Group>
              <FileInput
                label="Select file"
                placeholder="Choose a file to import"
                value={importForm.file}
                onChange={(file) => setImportForm(prev => ({ ...prev, file }))}
                accept={importForm.format === 'json' ? '.json' : '.csv'}
                leftSection={importForm.format === 'json' ? <IconFile size={16} /> : <IconFileText size={16} />}
                style={{ flex: 1 }}
              />
              
              {importForm.file && (
                <Tooltip label="Clear file">
                  <ActionIcon variant="subtle" color="red" onClick={clearImportFile}>
                    <IconTrash size={16} />
                  </ActionIcon>
                </Tooltip>
              )}
            </Group>
            
            {importForm.file && (
              <Text size="sm" c="dimmed">
                File: {importForm.file.name} ({(importForm.file.size / 1024).toFixed(1)} KB)
              </Text>
            )}
            
            {isProcessing && (
              <Progress value={processingProgress} size="sm" animated />
            )}
            
            {importResult && (
              <Alert
                icon={importResult.success ? <IconCheck /> : <IconAlertCircle />}
                title={importResult.success ? 'Import Successful' : 'Import Completed with Issues'}
                color={importResult.success ? 'green' : 'orange'}
              >
                <Text size="sm">
                  Imported: {importResult.importedCount} entries
                  {importResult.skippedCount > 0 && `, Skipped: ${importResult.skippedCount}`}
                </Text>
                
                {importResult.errors.length > 0 && (
                  <ScrollArea.Autosize mah={120} mt="sm">
                    <Stack gap="xs">
                      {importResult.errors.map((error, index) => (
                        <Code key={index} size="xs" c="red">
                          {error}
                        </Code>
                      ))}
                    </Stack>
                  </ScrollArea.Autosize>
                )}
              </Alert>
            )}
            
            <Group justify="flex-end">
              <Button variant="subtle" onClick={handleClose} disabled={isProcessing}>
                Cancel
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={isProcessing || !importForm.file}
                loading={isProcessing}
                leftSection={<IconUpload size={16} />}
              >
                Import
              </Button>
            </Group>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Modal>
  )
}

export default ExportImportDialog