import { Stack, Group, Button, Modal } from '@mantine/core'
import { IconPlus } from '@tabler/icons-react'
import { useState } from 'react'
import { ExpertTable } from '../components/experts/ExpertTable'
import { ExpertForm } from '../components/experts/ExpertForm'
import { useExperts, useCreateExpert, useUpdateExpert, useDeleteExpert } from '../hooks/useExperts'
import { LoadingState } from '../components/common/LoadingState'
import { openConfirmDialog } from '../components/common/ConfirmDialog'
import { Expert } from '../types'

export function ExpertManagement() {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedExpert, setSelectedExpert] = useState<Expert | undefined>()

  const { data: experts, isLoading } = useExperts()
  const createMutation = useCreateExpert()
  const updateMutation = useUpdateExpert()
  const deleteMutation = useDeleteExpert()

  const handleEdit = (expert: Expert) => {
    setSelectedExpert(expert)
    setModalOpen(true)
  }

  const handleDelete = (expert: Expert) => {
    openConfirmDialog({
      title: 'Delete Expert',
      message: `Are you sure you want to delete ${expert.name}? This action cannot be undone.`,
      confirmLabel: 'Delete',
      dangerous: true,
      onConfirm: () => deleteMutation.mutate(expert.id),
    })
  }

  const handleView = (expert: Expert) => {
    // TODO: Navigate to detail view
    console.log('View expert:', expert)
  }

  const handleSubmit = async (values: any) => {
    if (selectedExpert) {
      await updateMutation.mutateAsync({ id: selectedExpert.id, data: values })
    } else {
      await createMutation.mutateAsync(values)
    }
    setModalOpen(false)
    setSelectedExpert(undefined)
  }

  if (isLoading) {
    return <LoadingState text="Loading experts..." />
  }

  return (
    <Stack>
      <Group justify="space-between">
        <div />
        <Button leftSection={<IconPlus />} onClick={() => setModalOpen(true)}>
          Add Expert
        </Button>
      </Group>

      <ExpertTable
        experts={experts || []}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
      />

      <Modal
        opened={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setSelectedExpert(undefined)
        }}
        title={selectedExpert ? 'Edit Expert' : 'Create Expert'}
        size="lg"
      >
        <ExpertForm
          expert={selectedExpert}
          onSubmit={handleSubmit}
          onCancel={() => {
            setModalOpen(false)
            setSelectedExpert(undefined)
          }}
        />
      </Modal>
    </Stack>
  )
}