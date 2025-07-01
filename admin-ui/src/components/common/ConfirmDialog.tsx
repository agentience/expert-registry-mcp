import { Text, Button, Group } from '@mantine/core'
import { modals } from '@mantine/modals'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void | Promise<void>
  dangerous?: boolean
}

export function openConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  dangerous = false,
}: ConfirmDialogProps) {
  modals.openConfirmModal({
    title,
    children: <Text size="sm">{message}</Text>,
    labels: { confirm: confirmLabel, cancel: cancelLabel },
    confirmProps: { color: dangerous ? 'red' : 'blue' },
    onConfirm,
  })
}