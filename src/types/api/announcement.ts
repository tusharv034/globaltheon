type AnnouncementObject = {

}
export type ReadAnnoucementsResponse = AnnouncementObject[];

export type CreateAnnouncementPayload = {
    title: string,
    content: string,
    announcementType: string,
    targetRole: string,
    startDate: Date,
    endDate: Date,
    showOnce: boolean,
    requiresCompletion: boolean,
    isActive: boolean,
}
export type CreateAnnoucementResponse = {}
export type UpdateAnnoucementPayload = {
    _id: string,
    
}
export type UpdateAnnoucementResponse = {}
export type DeleteAnnoucementPayload = {
}
export type DeleteAnnoucementResponse = {}
// export ReadActiveAnnouncementsResponse