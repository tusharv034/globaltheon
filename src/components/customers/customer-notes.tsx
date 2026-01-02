import { NotesComponent } from "@/components/shared/notes-component";

interface CustomerNotesProps {
  customerId: string;
}

export function CustomerNotes({ customerId }: CustomerNotesProps) {
  return <NotesComponent entityId={customerId} entityType="customer" />;
}
