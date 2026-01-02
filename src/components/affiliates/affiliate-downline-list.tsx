// // In your AffiliateDownlineList component
// import { useState, useEffect } from "react";
// import { useQuery } from "@tanstack/react-query";
// import { Card, CardContent } from "@/components/ui/card";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Input } from "@/components/ui/input";
// import { Badge } from "@/components/ui/badge";
// import { Users, Search } from "lucide-react";
// import { format } from "date-fns";
// import { formatCurrency } from "@/lib/utils";
// import { getAffiliatesByEnroller } from "@/api/affiliate";
// import { useAuthStore } from "@/store/useAuthStore";

// interface AffiliateDownlineListProps {
//   affiliateId: string; // This should be the numeric selfAffiliateId
//   onAffiliateClick?: (affiliateId: string) => void;
// }

// export function AffiliateDownlineList({ affiliateId, onAffiliateClick }: AffiliateDownlineListProps) {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
//   const user = useAuthStore((state) => state.user);
//   const companyId = user?.selfClientId?.toString() || "1";

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setDebouncedSearchTerm(searchTerm);
//     }, 300);
//     return () => clearTimeout(timer);
//   }, [searchTerm]);

//   const { data: backendData, isLoading } = useQuery({
//     queryKey: ["affiliate-downline", affiliateId, debouncedSearchTerm, companyId],
//     queryFn: async () => {
//       const payload = {
//         companyId,
//         enrolledBy: affiliateId,
//         page: 1,
//         limit: 100,
//         search: debouncedSearchTerm || undefined,
//         sortBy: "enrollmentDate",
//         sortOrder: "asc" as const,
//       };

//       const response = await getAffiliatesByEnroller(payload);

//       if (!response.data.success) {
//         throw new Error(response.data.message);
//       }

//       return response.data.data;
//     },
//   });
//   const statusDisplayMap = {
//     1: "Active",
//     2: "Inactive",
//     3: "Pending KYC",
//     4: "Rejected",
//   };
//   const variants: Record<number, "default" | "secondary" | "destructive" | "outline"> = {
//     1: "default",
//     2: "secondary",
//     3: "outline",
//     4: "destructive",
//   };


//   // Fetch additional data (customer counts, commissions, etc.) similar to AffiliateTable
//   // This would require additional queries to your existing Supabase tables

//   if (isLoading) {
//     return (
//       <Card>
//         <CardContent className="pt-6">
//           <div className="text-center py-8">Loading affiliates...</div>
//         </CardContent>
//       </Card>
//     );
//   }

//   if (!backendData?.affiliates || backendData.affiliates.length === 0) {
//     return (
//       <Card>
//         <CardContent className="pt-6">
//           <div className="text-center py-8 text-muted-foreground">
//             <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
//             <p>No affiliates found for this affiliate</p>
//           </div>
//         </CardContent>
//       </Card>
//     );
//   }

//   return (
//     <Card>
//       <CardContent className="pt-6">
//         <div className="mb-4 flex items-center justify-between gap-4">
//           <div>
//             <h3 className="text-lg font-semibold">Affiliates</h3>
//             <p className="text-sm text-muted-foreground">
//               Total: {backendData.affiliates.length} affiliate{backendData.affiliates.length !== 1 ? 's' : ''}
//             </p>
//           </div>
//           <div className="relative w-64">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//             <Input
//               placeholder="Search affiliates..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="pl-10"
//             />
//           </div>
//         </div>

//         <div className="border rounded-lg overflow-hidden">
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>Name</TableHead>
//                 <TableHead>Phone</TableHead>
//                 <TableHead>Email</TableHead>
//                 <TableHead>Status</TableHead>
//                 <TableHead>Join Date</TableHead>
//                 <TableHead>Rank</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {backendData.affiliates.map((affiliate) => (
//                 <TableRow key={affiliate._id}>
//                   {/* <TableCell>
//                     {onAffiliateClick ? (
//                       <button
//                         onClick={() => onAffiliateClick(affiliate.selfAffiliateId.toString())}
//                         className="text-primary hover:underline text-left font-medium"
//                       >
//                         {affiliate.firstName} {affiliate.lastName}
//                       </button>
//                     ) : (
//                       `${affiliate.firstName} ${affiliate.lastName}`
//                     )}
//                   </TableCell> */}
//                   <TableCell>  {affiliate.firstName} {affiliate.lastName}</TableCell>
//                   <TableCell>{affiliate.phone || "-"}</TableCell>
//                   <TableCell>
//                     <a href={`mailto:${affiliate.email}`} className="text-primary hover:underline">
//                       {affiliate.email}
//                     </a>
//                   </TableCell>


//                   <TableCell>
//                     <Badge variant={variants[affiliate.status] || "secondary"}>
//                       {statusDisplayMap[affiliate.status] || "Unknown Status"}
//                     </Badge>
//                   </TableCell>
//                   <TableCell>
//                     {format(new Date(affiliate.enrollmentDate), "MMM d, yyyy")}
//                   </TableCell>
//                   <TableCell>{affiliate.rank}</TableCell>
//                 </TableRow>
//               ))}
//             </TableBody>
//           </Table>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }
// AffiliateDownlineList.tsx
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Users, Search, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { getAffiliatesByEnroller } from "@/api/affiliate";
import { useAuthStore } from "@/store/useAuthStore";
import { useDateFormatStore } from "@/store/useDateFormat";
import { getDateFormatString } from "@/utils/resolveDateFormat";

interface AffiliateDownlineAffiliate {
  _id: string;
  selfAffiliateId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  status: number;
  enrollmentDate: string;
  rank?: {
    rankName: string
  }
}

interface AffiliateDownlineListProps {
  affiliateId: string;
  onAffiliateClick?: (affiliateId: string) => void;
}

export function AffiliateDownlineList({
  affiliateId,
  onAffiliateClick,
}: AffiliateDownlineListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const user = useAuthStore((state) => state.user);
  const companyId = user?.selfClientId?.toString() || "1";
  const { dateFormatRegion, dateFormatVariant } = useDateFormatStore();
  const formatString = getDateFormatString(dateFormatRegion, dateFormatVariant);
  // Debounce search + reset page
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // const { data, isLoading } = useQuery({
  //   queryKey: [
  //     "affiliate-downline",
  //     affiliateId,
  //     companyId,
  //     debouncedSearchTerm,
  //     currentPage,
  //     itemsPerPage,
  //   ],
  //   queryFn: async () => {
  //     const payload = {
  //       companyId,
  //       enrolledBy: affiliateId,
  //       page: currentPage,
  //       limit: itemsPerPage,
  //       search: debouncedSearchTerm || undefined,
  //       sortBy: "enrollmentDate",
  //       sortOrder: "asc" as const,
  //     };

  //     const response = await getAffiliatesByEnroller(payload);
  //     if (!response.data.success) {
  //       throw new Error(response.data.message || "Failed to fetch downline");
  //     }
  //     return response.data.data; // { affiliates: [...], pagination: { ... } }
  //   },
  // });
  const { data, isLoading } = useQuery({
    queryKey: [
      "affiliate-downline",
      affiliateId,
      companyId,
      debouncedSearchTerm,
      currentPage,
      itemsPerPage, // ← this must change!
    ],
    queryFn: async () => {
      const payload = {
        companyId,
        enrolledBy: affiliateId,
        page: currentPage,
        limit: itemsPerPage,           // ← MAKE SURE THIS IS itemsPerPage, not hardcoded!
        search: debouncedSearchTerm || undefined,
        sortBy: "enrollmentDate",
        sortOrder: "asc" as const,
      };


      const response = await getAffiliatesByEnroller(payload);

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to fetch downline");
      }

      return response.data.data;
    },
    // Optional: force refetch when itemsPerPage changes
    enabled: !!affiliateId && !!companyId,
  });
  const affiliates: AffiliateDownlineAffiliate[] = data?.affiliates || [];
  const pagination = data?.pagination || {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
  };
  const totalCount = pagination.totalCount || 0;

  const statusDisplayMap: Record<number, string> = {
    1: "Active",
    2: "Inactive",
    3: "Pending KYC",
    4: "Rejected",
  };

  const badgeVariants: Record<
    number,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    1: "default",
    2: "secondary",
    3: "outline",
    4: "destructive",
  };

  return (
    <Card>
      <CardContent className="pt-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Downline Affiliates</h3>
            <p className="text-sm text-muted-foreground">
              Total: {totalCount} affiliate{totalCount !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search affiliates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead>Rank</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={10} className="h-64 text-center"> {/* Adjust colSpan to match your columns */}
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <Loader2 className="h-10 w-10 animate-spin text-primary" />
                      <p className="text-muted-foreground">Loading affiliates...</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && affiliates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No affiliates found in downline</p>
                  </TableCell>
                </TableRow>
              ) : (
                affiliates.map((aff) => (
                  <TableRow key={aff._id}>
                    {/* <TableCell className="font-medium">
                      {onAffiliateClick ? (
                        <button
                          onClick={() => onAffiliateClick(aff.selfAffiliateId.toString())}
                          className="text-primary hover:underline"
                        >
                          {aff.firstName} {aff.lastName}
                        </button>
                      ) : (
                        `${aff.firstName}   ${aff.lastName}`
                      )}
                    </TableCell> */}
                    <TableCell>  {aff.firstName} {aff.lastName}</TableCell>
                    <TableCell>{aff.phone || "-"}</TableCell>
                    <TableCell>
                      <a href={`mailto:${aff.email}`} className="text-primary hover:underline">
                        {aff.email}
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge variant={badgeVariants[aff.status] || "secondary"}>
                        {statusDisplayMap[aff.status] || "Unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {aff.enrollmentDate && format(new Date(aff.enrollmentDate),formatString)}
                    </TableCell>
                    <TableCell>{aff.rank?.rankName || "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination - EXACT SAME AS CUSTOMERS LIST */}
        {totalCount > 0 && (
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Showing{" "}
                {((currentPage - 1) * itemsPerPage) + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount}{" "}
                affiliate{totalCount !== 1 ? "s" : ""}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Per page:</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[80px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>

              {/* Simple page buttons - max 5 shown */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center gap-1">
                  {Array.from(
                    { length: Math.min(5, pagination.totalPages) },
                    (_, i) => i + 1
                  ).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="min-w-[2.5rem]"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
              )}

              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {pagination.totalPages}
              </span>

              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={currentPage === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}