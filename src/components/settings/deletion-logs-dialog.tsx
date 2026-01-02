// import { useQuery } from "@tanstack/react-query";
// import { supabase } from "@/integrations/supabase/client";
// import { useState } from "react";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { useDateFormatStore } from "@/store/useDateFormat";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Checkbox } from "@/components/ui/checkbox";
// import { format } from "date-fns";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { readAllAdmins, readDeletionLogs } from "@/api/auth";
// import { Loader2 } from "lucide-react";
// import { getDateFormatString } from "@/utils/resolveDateFormat";

// interface DeletionLogsDialogProps {
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
// }

// export function DeletionLogsDialog({ open, onOpenChange }: DeletionLogsDialogProps) {

//   // state to store which logs to show
//   const [entityTypes, setEntityTypes] = useState<string[]>(["customer", "affiliate", "order"]);

//   // state to store the startDate filter value
//   const [startDate, setStartDate] = useState<string>(null);

//   // state to store the endDate filter value
//   const [endDate, setEndDate] = useState<string>(null);

//   // state to store the deletedBy
//   const [selectedAdmin, setSelectedAdmin] = useState<string>("all");

//   // === PAGINATION STATE ===
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage, setItemsPerPage] = useState(50);

//   const { dateFormatRegion, dateFormatVariant } = useDateFormatStore();
//   const formatString = getDateFormatString(dateFormatRegion, dateFormatVariant);


//   // Fetch admins list
//   const { data: admins, isLoading: adminIsLoading } = useQuery({
//     queryKey: ["admins-list"],
//     queryFn: async () => {

//       const response = await readAllAdmins();

//       // console.log('admin response is ', response.data.data);

//       return response.data.data || [];
//     },
//     enabled: open,
//   });

//   // fetch all deletion logs
//   const { data: logs, isLoading, isFetching } = useQuery({
//     queryKey: ["deletion-logs", entityTypes, startDate, endDate, selectedAdmin, currentPage, itemsPerPage],
//     queryFn: async () => {

//       const payload = {
//         page: currentPage,
//         limit: itemsPerPage,
//         entityTypes
//       }

//       console.log("startDate is ", startDate);
//       console.log("endDate is ", endDate);
//       if (selectedAdmin !== "all") {
//         payload.selectedAdmin = selectedAdmin
//       };
//       if (startDate !== null && startDate !== "") {
//         payload.startDate = startDate
//       };
//       if (endDate !== null && endDate !== "") {
//         payload.endDate = endDate
//       };

//       console.log("payload is ", payload);
//       // return;

//       const response = await readDeletionLogs(payload);

//       console.log("logs are ", response.data.data);

//       return response.data.data;
//     },
 
//     enabled: open,
//   });

//   // function to change the entity type
//   const toggleEntityType = (type: string) => {
//     setEntityTypes(prev =>
//       prev.includes(type)
//         ? prev.filter(t => t !== type)
//         : [...prev, type]
//     );
//   };

//   // function to clear all the filters
//   const clearFilters = () => {
//     setEntityTypes(["customer", "affiliate", "order"]);
//     setStartDate("");
//     setEndDate("");
//     setSelectedAdmin("all");
//   };

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="max-w-6xl max-h-[90vh]">
//         <DialogHeader>
//           <DialogTitle>Deletion Audit Logs</DialogTitle>
//         </DialogHeader>

//         {/* Filters Section */}
//         <div className="space-y-4 border-b pb-4">
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//             {/* Entity Type Filter */}
//             <div className="space-y-2">
//               <Label>Record Type</Label>
//               <div className="flex flex-col gap-2">
//                 <div className="flex items-center space-x-2">
//                   <Checkbox
//                     id="customer"
//                     checked={entityTypes.includes("customer")}
//                     onCheckedChange={() => toggleEntityType("customer")}
//                   />
//                   <label htmlFor="customer" className="text-sm cursor-pointer">Customers</label>
//                 </div>
//                 <div className="flex items-center space-x-2">
//                   <Checkbox
//                     id="affiliate"
//                     checked={entityTypes.includes("affiliate")}
//                     onCheckedChange={() => toggleEntityType("affiliate")}
//                   />
//                   <label htmlFor="affiliate" className="text-sm cursor-pointer">Affiliates</label>
//                 </div>
//                 <div className="flex items-center space-x-2">
//                   <Checkbox
//                     id="order"
//                     checked={entityTypes.includes("order")}
//                     onCheckedChange={() => toggleEntityType("order")}
//                   />
//                   <label htmlFor="order" className="text-sm cursor-pointer">Orders</label>
//                 </div>
//               </div>
//             </div>

//             {/* Date Range Filters */}
//             <div className="space-y-2">
//               <Label htmlFor="start-date">Start Date</Label>
//               <Input
//                 id="start-date"
//                 type="date"
//                 value={startDate}
//                 onChange={(e) => setStartDate(e.target.value)}
//               />
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="end-date">End Date</Label>
//               <Input
//                 id="end-date"
//                 type="date"
//                 value={endDate}
//                 onChange={(e) => setEndDate(e.target.value)}
//               />
//             </div>

//             {/* Deleted By Filter */}
//             <div className="space-y-2">
//               <Label htmlFor="admin-filter">Deleted By</Label>
//               <Select value={selectedAdmin} onValueChange={setSelectedAdmin}>
//                 <SelectTrigger id="admin-filter">
//                   <SelectValue placeholder="All Admins" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">All Admins</SelectItem>
//                   {adminIsLoading && (
//                     <>
//                       <Loader2 />
//                     </>
//                   )}
//                   {!adminIsLoading && admins?.map((admin) => (
//                     <SelectItem key={admin._id} value={admin._id}>
//                       {admin.firstName} {admin.lastName}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>
//           </div>

//           <Button
//             variant="outline"
//             size="sm"
//             onClick={clearFilters}
//             className="mt-2"
//           >
//             Clear Filters
//           </Button>
//         </div>

//         <ScrollArea className="h-[500px] w-full relative">

//           <div className="border rounded-lg overflow-hidden min-w-full">
//             <Table>
//               <TableHeader className="sticky top-0 z-10 bg-background">
//                 <TableRow>
//                   <TableHead>Type</TableHead>
//                   <TableHead>Identifier</TableHead>
//                   <TableHead>Name</TableHead>
//                   <TableHead>Deletion Type</TableHead>
//                   <TableHead>Deleted By</TableHead>
//                   <TableHead>Deletion Date</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {isLoading && (
//                   <>
//                     <TableRow>
//                       <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
//                         <div className="flex justify-center items-center">
//                           <Loader2 />
//                         </div>
//                       </TableCell>
//                     </TableRow>
//                   </>
//                 )}

//                 {!isLoading && logs?.logs?.length === 0 && (

//                   <TableRow>
//                     <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
//                       <div className="text-muted-foreground flex justify-center items-center">
//                         <p className="text-center">No deletion logs found</p>
//                       </div>
//                     </TableCell>
//                   </TableRow>
//                 )}

//                 {!isLoading && logs?.logs?.length !== 0 && logs?.logs?.map((log: any) => (
//                   <TableRow key={log._id}>
//                     <TableCell>
//                       <Badge variant="outline" className="capitalize">
//                         {log.entityType}
//                       </Badge>
//                     </TableCell>
//                     <TableCell className="font-medium">
//                       {log.entityIdentifier}
//                     </TableCell>
//                     <TableCell>{log.entityName}</TableCell>
//                     <TableCell>
//                       <Badge
//                         variant={log.deletedType === "bulk_empty_folder" ? "destructive" : "secondary"}
//                       >
//                         {log.deletedType === "bulk_empty_folder"
//                           ? `Bulk (${log.additionalInfo?.bulkCount || 0})`
//                           : "Single"}
//                       </Badge>
//                     </TableCell>
//                     <TableCell>
//                       {log.deletedBy
//                         ? `${log.deletedBy.firstName} ${log.deletedBy.lastName}`
//                         : "Unknown"}
//                     </TableCell>
//                     <TableCell>
//                       {format(new Date(log.deletedAt), `${formatString} h:mm a`)}
//                     </TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           </div>

//         </ScrollArea>

//         {/* Pagination */}
//         {/* {true && ( */}
//         {/* === FINAL PAGINATION (Beautiful & Correct) === */}
//         {true && logs?.pagination && (
//           <div className="flex items-center justify-between mt-6 pt-4 border-t">
//             <div className="flex items-center gap-6">
//               <p className="text-sm text-muted-foreground">
//                 Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
//                 {Math.min(currentPage * itemsPerPage, logs.pagination.total)} of {logs?.pagination?.total?.toLocaleString()}{" "}
//                 logs
//               </p>

//               <div className="flex items-center gap-2">
//                 <span className="text-sm text-muted-foreground">Per page:</span>
//                 <Select
//                   value={itemsPerPage.toString()}
//                   onValueChange={(v) => {
//                     setItemsPerPage(Number(v));
//                     setCurrentPage(1);
//                   }}
//                 >
//                   <SelectTrigger className="w-20">
//                     <SelectValue />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {[25, 50, 100, 250].map(n => (
//                       <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
//             </div>

//             <div className="flex items-center gap-3">
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
//                 disabled={currentPage === 1 || isFetching}
//               >
//                 Previous
//               </Button>

//               <span className="text-sm text-muted-foreground">
//                 Page {currentPage} of {logs.pagination.totalPages}
//               </span>

//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={() => setCurrentPage(p => Math.min(logs.pagination.totalPages, p + 1))}
//                 disabled={currentPage >= logs.pagination.totalPages || isFetching}
//               >
//                 Next
//               </Button>
//             </div>
//           </div>
//         )}
//       </DialogContent>
//     </Dialog>
//   );
// }



import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useDateFormatStore } from "@/store/useDateFormat";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { readAllAdmins, readDeletionLogs } from "@/api/auth";
import { Loader2, CalendarIcon } from "lucide-react";
import { getDateFormatString } from "@/utils/resolveDateFormat";
import { Calendar } from "@/components/ui/calendar"; // ← Your custom Calendar component
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DeletionLogsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeletionLogsDialog({ open, onOpenChange }: DeletionLogsDialogProps) {
  const [entityTypes, setEntityTypes] = useState<string[]>(["customer", "affiliate", "order"]);

  // Use Date objects instead of strings
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const [selectedAdmin, setSelectedAdmin] = useState<string>("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const { dateFormatRegion, dateFormatVariant } = useDateFormatStore();
  const formatString = getDateFormatString(dateFormatRegion, dateFormatVariant);

  // Fetch admins list
  const { data: admins, isLoading: adminIsLoading } = useQuery({
    queryKey: ["admins-list"],
    queryFn: async () => {
      const response = await readAllAdmins();
      return response.data.data || [];
    },
    enabled: open,
  });

  // Fetch deletion logs
  const { data: logs, isLoading, isFetching } = useQuery({
    queryKey: [
      "deletion-logs",
      entityTypes,
      startDate ? format(startDate, "yyyy-MM-dd") : null,
      endDate ? format(endDate, "yyyy-MM-dd") : null,
      selectedAdmin,
      currentPage,
      itemsPerPage,
    ],
    queryFn: async () => {
      const payload: any = {
        page: currentPage,
        limit: itemsPerPage,
        entityTypes,
      };

      if (selectedAdmin !== "all") {
        payload.selectedAdmin = selectedAdmin;
      }
      if (startDate) {
        payload.startDate = format(startDate, "yyyy-MM-dd");
      }
      if (endDate) {
        payload.endDate = format(endDate, "yyyy-MM-dd");
      }

      const response = await readDeletionLogs(payload);
      return response.data.data;
    },
    enabled: open,
  });

  const toggleEntityType = (type: string) => {
    setEntityTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setEntityTypes(["customer", "affiliate", "order"]);
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedAdmin("all");
    setCurrentPage(1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Deletion Audit Logs</DialogTitle>
        </DialogHeader>

        {/* Filters Section */}
        <div className="space-y-4 border-b pb-4 h-fit">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Entity Type Filter */}
            <div className="space-y-2">
              <Label>Record Type</Label>
              <div className="flex flex-col gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="customer"
                    checked={entityTypes.includes("customer")}
                    onCheckedChange={() => toggleEntityType("customer")}
                  />
                  <label htmlFor="customer" className="text-sm cursor-pointer">
                    Customers
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="affiliate"
                    checked={entityTypes.includes("affiliate")}
                    onCheckedChange={() => toggleEntityType("affiliate")}
                  />
                  <label htmlFor="affiliate" className="text-sm cursor-pointer">
                    Affiliates
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="order"
                    checked={entityTypes.includes("order")}
                    onCheckedChange={() => toggleEntityType("order")}
                  />
                  <label htmlFor="order" className="text-sm cursor-pointer">
                    Orders
                  </label>
                </div>
              </div>
            </div>

            {/* Start Date Picker */}
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, formatString) : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date);
                      setCurrentPage(1);
                    }}
                    formatString={formatString}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End Date Picker */}
            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, formatString) : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      setEndDate(date);
                      setCurrentPage(1);
                    }}
                    formatString={formatString}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Deleted By Filter */}
            <div className="space-y-2">
              <Label>Deleted By</Label>
              <Select value={selectedAdmin} onValueChange={(val) => {
                setSelectedAdmin(val);
                setCurrentPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Admins" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Admins</SelectItem>
                  {adminIsLoading ? (
                    <div className="flex items-center gap-2 px-3 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </div>
                  ) : (
                    admins?.map((admin: any) => (
                      <SelectItem key={admin._id} value={admin._id}>
                        {admin.firstName} {admin.lastName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={clearFilters} className="mt-2">
            Clear Filters
          </Button>
        </div>

        {/* Table */}
        <ScrollArea className="min-h-fit max-h-[500px] w-full relative">
          <div className="border rounded-lg overflow-hidden min-w-full">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-background">
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Identifier</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Deletion Type</TableHead>
                  <TableHead>Deleted By</TableHead>
                  <TableHead>Deletion Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading && logs?.logs?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No deletion logs found
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading &&
                  logs?.logs?.map((log: any) => (
                    <TableRow key={log._id}>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {log.entityType}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{log.entityIdentifier}</TableCell>
                      <TableCell>{log.entityName}</TableCell>
                      <TableCell>
                        <Badge
                          variant={log.deletedType === "bulk_empty_folder" ? "destructive" : "secondary"}
                        >
                          {log.deletedType === "bulk_empty_folder"
                            ? `Bulk (${log.additionalInfo?.bulkCount || 0})`
                            : "Single"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {log.deletedBy
                          ? `${log.deletedBy.firstName} ${log.deletedBy.lastName}`
                          : "Unknown"}
                      </TableCell>
                      <TableCell>{format(new Date(log.deletedAt), `${formatString} h:mm a`)}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>

        {/* Pagination */}
        {logs?.pagination && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <div className="flex items-center gap-6">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, logs.pagination.total)} of{" "}
                {logs.pagination.total.toLocaleString()} logs
              </p>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Per page:</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(v) => {
                    setItemsPerPage(Number(v));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[25, 50, 100, 250].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || isFetching}
              >
                Previous
              </Button>

              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {logs.pagination.totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(logs.pagination.totalPages, p + 1))}
                disabled={currentPage >= logs.pagination.totalPages || isFetching}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}