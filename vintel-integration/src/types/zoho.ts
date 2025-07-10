export interface ZohoContact {
  id: string;
  Company: string | null;
  Email: string;
  First_Name: string | null;
  Last_Name: string;
  Phone: string | null;
}

export interface ZohoSalesOrder {
  id: string;
  Subject: string;
  Status: string;
  Grand_Total: number;
  Contact_Name: { id: string; name: string } | null;
}

export interface ZohoDeal {
  id: string;
  Deal_Name: string;
  Stage: string;
  Amount: number;
  Contact_Name: { id: string; name: string } | null;
}

export interface ZohoTask {
  id: string;
  Subject: string;
  Status: string;
  Due_Date: string;
  Priority: string;
}

export interface ZohoNote {
  id: string;
  Note_Title: string;
  Note_Content: string;
  Parent_Id: { id: string; name: string } | null;
  Created_Time?: string;
}

export interface CRMData {
  contact: ZohoContact | null;
  salesOrders: ZohoSalesOrder[];
  deals: ZohoDeal[];
  tasks: ZohoTask[];
  notes: ZohoNote[];
}

export interface APIResponse<T> {
  success: boolean;
  data: T;
  message: string;
}
