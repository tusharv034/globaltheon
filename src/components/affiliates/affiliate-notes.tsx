import { NotesComponent } from "@/components/shared/notes-component";

interface AffiliateNotesProps {
  affiliateId: string;
}

export function AffiliateNotes({ affiliateId }: AffiliateNotesProps) {
  return <NotesComponent entityId={affiliateId} entityType="affiliate" />;
}
