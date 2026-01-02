type PaginationData = {
    page: number;
    limit: number | null;
    total: number;
    totalPages: number | null;
};

type CompanyUser = {
    _id: string;
    email: string;
    password?: string;                  
    clientId?: string;                  
    selfClientId: number;
    roleId: string;
    firstName: string;
    lastName: string;
    createdAt: string;                  
    updatedAt: string;                  
    [key: string]: any;
};

export type ReadCompanyUsersResponse = {
    companyUsers: CompanyUser[],
    pagination: PaginationData
};

type UserPermissions = {
  module: string,
  section: string,
  permission: "view" | "edit" | "none"
}

export type CreateCompanyUserPayload = {
    firstName: string,
    lastName: string,
    email: string,
    roleId: string,
    permissions: UserPermissions[],
    password: string
};

export type CreateCompanyUserResponse = {
    companyUsers: CompanyUser
};

export type UpdateCompanyUserPayload = {
    _id: string,
    firstName?: string,
    lastName?: string,
    email?: string,
    roleId?: string,
    permissions?: UserPermissions[],
    password?: string
};

export type UpdateCompanyUserResponse = {
    companyUsers: CompanyUser
};

type RoleMasterObject = {
    _id: string,
    clientId: string,
    selfClientId: number,
    role: string,
    roleLabel: string,
    isInternal: boolean,
    createdBy: string,
    createdAt:Date
    updatedAt:Date
}

export type ReadRoleMasterResponse = RoleMasterObject[];

export type DeleteCompanyUserPayload = {
    _id: string
}

export type DeleteCompanyUserResponse = {}