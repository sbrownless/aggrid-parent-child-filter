export interface catalogEntryModel {
  uniqueId: string;
  lastUpdatedBy: string;
  createdBy: string;
  catalogDetails: catalogDetailModel[];
  changeTicketNumber: string;
  status: string;
  changeType: string;
  lastUpdated: Date;
}

export interface catalogDetailModel {
  updatedBy: string;
  fieldChanged: string;
  originalValue: string;
  newValue: string;
}
