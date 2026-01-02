// import { useState, useEffect } from "react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import * as z from "zod";
// import { supabase } from "@/integrations/supabase/client";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { useToast } from "@/hooks/use-toast";
// import { Loader2 } from "lucide-react";
// import { useModulePermissions } from "@/hooks/use-module-permissions";

// const compensationSchema = z.object({
//   num_levels: z.coerce.number().min(1).max(10),
//   level_percentages: z.record(z.string(), z.coerce.number().min(0).max(100)),
//   default_rank_name: z.string().min(1, "Rank name is required"),
// });

// type CompensationFormData = z.infer<typeof compensationSchema>;

// export function CompensationTab() {
//   const [loading, setLoading] = useState(false);
//   const [existingId, setExistingId] = useState<string | null>(null);
//   const { toast } = useToast();
//   const { hasPermission } = useModulePermissions();
//   const canEdit = hasPermission("company_settings_compensation", "edit");

//   const {
//     register,
//     handleSubmit,
//     reset,
//     watch,
//     setValue,
//     formState: { errors },
//   } = useForm<CompensationFormData>({
//     resolver: zodResolver(compensationSchema),
//     defaultValues: {
//       num_levels: 2,
//       level_percentages: { "1": 10, "2": 5 },
//       default_rank_name: "Affiliate",
//     },
//   });

//   const numLevels = watch("num_levels");

//   useEffect(() => {
//     loadCompensationPlan();
//   }, []);

//   const loadCompensationPlan = async () => {
//     try {
//       const { data, error } = await supabase
//         .from("compensation_plans")
//         .select("*")
//         .single();

//       if (error && error.code !== "PGRST116") {
//         throw error;
//       }

//       if (data) {
//         setExistingId(data.id);
//         const levelPercentages = data.level_percentages as Record<string, number>;
//         reset({
//           num_levels: data.num_levels,
//           level_percentages: levelPercentages,
//           default_rank_name: data.default_rank_name,
//         });
//       }
//     } catch (error: any) {
//       console.error("Error loading compensation plan:", error);
//       toast({
//         title: "Error",
//         description: "Failed to load compensation plan",
//         variant: "destructive",
//       });
//     }
//   };

//   const onSubmit = async (data: CompensationFormData) => {
//     if (!canEdit) {
//       toast({
//         title: "Permission Denied",
//         description: "You need edit permissions to save compensation settings.",
//         variant: "destructive",
//       });
//       return;
//     }
//     setLoading(true);
//     try {
//       if (existingId) {
//         const { error } = await supabase
//           .from("compensation_plans")
//           .update(data)
//           .eq("id", existingId);

//         if (error) throw error;
//       } else {
//         const { data: newData, error } = await supabase
//           .from("compensation_plans")
//           .insert([data])
//           .select()
//           .single();

//         if (error) throw error;
//         if (newData) setExistingId(newData.id);
//       }

//       toast({
//         title: "Success",
//         description: "Compensation plan saved successfully",
//       });
//     } catch (error: any) {
//       console.error("Error saving compensation plan:", error);
//       toast({
//         title: "Error",
//         description: error.message || "Failed to save compensation plan",
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="space-y-6">
//       <div className="space-y-2">
//         <h3 className="text-lg font-semibold">Affiliate Program Configuration</h3>
//         <p className="text-sm text-muted-foreground">
//           Configure your multi-level affiliate compensation structure
//         </p>
//       </div>

//       <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
//         <div className="space-y-2">
//           <Label htmlFor="num_levels">Number of Levels</Label>
//           <Input
//             id="num_levels"
//             type="number"
//             min="1"
//             max="10"
//             className="max-w-[40%]"
//             {...register("num_levels")}
//             disabled={!canEdit}
//           />
//           {errors.num_levels && (
//             <p className="text-sm text-destructive">{errors.num_levels.message}</p>
//           )}
//           <p className="text-sm text-muted-foreground">
//             Support for up to 10 levels - commission fields will appear dynamically
//           </p>
//         </div>

//         <div className="space-y-4">
//           {Array.from({ length: numLevels }, (_, i) => i + 1).map((level) => (
//             <div key={level} className="space-y-2">
//               <Label htmlFor={`level_${level}_percentage`}>
//                 Level {level} Commission %
//               </Label>
//               <Input
//                 id={`level_${level}_percentage`}
//                 type="number"
//                 step="0.01"
//                 min="0"
//                 max="100"
//                 className="max-w-[40%]"
//                 {...register(`level_percentages.${level}` as any)}
//                 disabled={!canEdit}
//               />
//               {errors.level_percentages?.[level.toString()] && (
//                 <p className="text-sm text-destructive">
//                   {errors.level_percentages[level.toString()]?.message}
//                 </p>
//               )}
//             </div>
//           ))}
//         </div>

//         <div className="space-y-2">
//           <Label htmlFor="default_rank_name">Default Rank Name</Label>
//           <Input
//             id="default_rank_name"
//             className="max-w-[40%]"
//             {...register("default_rank_name")}
//             placeholder="e.g., Affiliate, Partner, Ambassador"
//             disabled={!canEdit}
//           />
//           {errors.default_rank_name && (
//             <p className="text-sm text-destructive">
//               {errors.default_rank_name.message}
//             </p>
//           )}
//           <p className="text-sm text-muted-foreground">
//             The default rank assigned to new affiliates
//           </p>
//         </div>

//             <Button type="submit" disabled={loading || !canEdit}>
//               {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
//               Save Compensation Plan
//             </Button>
//       </form>
//     </div>
//   );
// }

// WORKING CODE BEFORE ADDING DATE FORMAT SELECTION

// import { useState, useEffect } from "react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import * as z from "zod";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { useToast } from "@/hooks/use-toast";
// import { Loader2 } from "lucide-react";
// import { useModulePermissions } from "@/hooks/use-module-permissions";
// import { useQuery, useMutation } from "@tanstack/react-query";
// import { getCompensationPlan, updateCompensationPlan } from "@/api/compensationPlan";

// const compensationSchema = z.object({
//   numLevels: z.coerce.number().min(1).max(10),
//   levelPercentage: z.record(z.string(), z.coerce.number().min(0).max(100)),
//   defaultRankName: z.string().min(1, "Rank name is required"),
// });

// type CompensationFormData = z.infer<typeof compensationSchema>;

// export function CompensationTab() {
//   const [loading, setLoading] = useState(false);
//   const [existingId, setExistingId] = useState<string | null>(null);
//   const { toast } = useToast();
//   const { hasPermission } = useModulePermissions();
//   const canEdit = hasPermission("company_settings_permissions","compensation", "edit");

//   const {
//     register,
//     handleSubmit,
//     reset,
//     watch,
//     setValue,
//     formState: { errors },
//   } = useForm<CompensationFormData>({
//     resolver: zodResolver(compensationSchema),
//     defaultValues: {
//       numLevels: 2,
//       levelPercentage: { "1": 10, "2": 5 },
//       defaultRankName: "Affiliate",
//     },
//   });

//   const numLevels = watch("numLevels");

//   const { data, error, isError } = useQuery({
//     queryKey: ['compensationPlan'],
//     queryFn: getCompensationPlan
//   });

//   const compensationPlan = data?.data?.data;
//   useEffect(() => {
//     if (compensationPlan) {
//       reset({
//         numLevels: compensationPlan.numLevels,
//         levelPercentage: compensationPlan.levelPercentage,
//         defaultRankName: compensationPlan.defaultRankName,
//       })
//     }
//   }, [compensationPlan, reset])

//   const mutation = useMutation({
//     mutationFn: updateCompensationPlan,
//     onMutate: () => {
//       setLoading(true);
//     },
//     onSuccess: (response) => {
//       setLoading(false);
//       toast({
//         title: "Success",
//         description: response.data?.message || "Compensation plan saved successfully",
//       });
//     },
//     onError: (error) => {
//       setLoading(false);
//       toast({
//         title: "Error",
//         description: error.message || "Failed to save compensation plan",
//         variant: "destructive",
//       });
//     }
//   })

//  const onSubmit = async (compensationPlan) => {
//   // Create a new object that only contains the level percentages for the selected number of levels
//   const filteredLevelPercentages = Object.fromEntries(
//     Object.entries(compensationPlan.levelPercentage)
//       .filter(([level]) => parseInt(level) <= compensationPlan.numLevels)
//   );

//   // Prepare the final data to be submitted
//   const dataToSubmit = {
//     ...compensationPlan,
//     levelPercentage: filteredLevelPercentages,
//   };

//   // Submit the filtered data
//   mutation.mutate(dataToSubmit);
// };


//   return (
//     <div className="space-y-6">
//       <div className="space-y-2">
//         <h3 className="text-lg font-semibold">Affiliate Program Configuration</h3>
//         <p className="text-sm text-muted-foreground">
//           Configure your multi-level affiliate compensation structure
//         </p>
//       </div>

//       <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
//         <div className="space-y-2">
//           <Label htmlFor="num_levels">Number of Levels</Label>
//           <Input
//             id="num_levels"
//             type="number"
//             min="1"
//             max="10"
//             className="max-w-[40%]"
//             {...register("numLevels")}
//             disabled={!canEdit}
//           />
//           {errors.numLevels && (
//             <p className="text-sm text-destructive">{errors.numLevels.message}</p>
//           )}
//           <p className="text-sm text-muted-foreground">
//             Support for up to 10 levels - commission fields will appear dynamically
//           </p>
//         </div>

//         <div className="space-y-4">
//           {Array.from({ length: numLevels }, (_, i) => i + 1).map((level) => (
//             <div key={level} className="space-y-2">
//               <Label htmlFor={`level_${level}_percentage`}>
//                 Level {level} Commission %
//               </Label>
//               <Input
//                 id={`level_${level}_percentage`}
//                 type="number"
//                 step="0.01"
//                 min="0"
//                 max="100"
//                 className="max-w-[40%]"
//                 {...register(`levelPercentage.${level}` as any)}
//                 disabled={!canEdit}
//               />
//               {errors.levelPercentage?.[level.toString()] && (
//                 <p className="text-sm text-destructive">
//                   {errors.levelPercentage[level.toString()]?.message}
//                 </p>
//               )}
//             </div>
//           ))}
//         </div>

//         <div className="space-y-2">
//           <Label htmlFor="default_rank_name">Default Rank Name</Label>
//           <Input
//             id="default_rank_name"
//             className="max-w-[40%]"
//             {...register("defaultRankName")}
//             placeholder="e.g., Affiliate, Partner, Ambassador"
//             disabled={!canEdit}
//           />
//           {errors.defaultRankName && (
//             <p className="text-sm text-destructive">
//               {errors.defaultRankName.message}
//             </p>
//           )}
//           <p className="text-sm text-muted-foreground">
//             The default rank assigned to new affiliates
//           </p>
//         </div>

//         <Button type="submit" disabled={loading || !canEdit}>
//           {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
//           Save Compensation Plan
//         </Button>
//       </form>
//     </div>
//   );
// }


import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useModulePermissions } from "@/hooks/use-module-permissions";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCompensationPlan, updateCompensationPlan } from "@/api/compensationPlan";
import { useDateFormatStore } from "@/store/useDateFormat"; // Import the store

const compensationSchema = z.object({
  numLevels: z.coerce.number().min(1).max(10),
  levelPercentage: z.record(z.string(), z.coerce.number().min(0).max(100)),
  defaultRankName: z.string().min(1, "Rank name is required"),
  dateFormatRegion: z.string(),
  dateFormatVariant: z.string(),
});

type CompensationFormData = z.infer<typeof compensationSchema>;

export function CompensationTab() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { hasPermission } = useModulePermissions();
  const canEdit = hasPermission("company_settings_permissions", "compensation", "edit");
  const queryClient = useQueryClient();
  
  // Get the Zustand store actions
  const { setDateFormat } = useDateFormatStore();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<CompensationFormData>({
    resolver: zodResolver(compensationSchema),
    defaultValues: {
      numLevels: 2,
      levelPercentage: { "1": 10, "2": 5 },
      defaultRankName: "Affiliate",
      dateFormatRegion: "default",
      dateFormatVariant: "short",
    },
  });

  const numLevels = watch("numLevels");
  const dateFormatRegion = watch("dateFormatRegion");
  const dateFormatVariant = watch("dateFormatVariant");

  const {
    data,
    isLoading,
  } = useQuery({
    queryKey: ["compensationPlan"],
    queryFn: getCompensationPlan,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const compensationPlan = data?.data?.data;
 

  // Populate form as soon as data arrives from backend
  useEffect(() => {
    if (compensationPlan) {
      reset({
        numLevels: compensationPlan.numLevels ?? 2,
        levelPercentage: compensationPlan.levelPercentage ?? { "1": 10, "2": 5 },
        defaultRankName: compensationPlan.defaultRankName ?? "Affiliate",
        dateFormatRegion: compensationPlan.dateFormatRegion ?? "default",
        dateFormatVariant: compensationPlan.dateFormatVariant ?? "short",
      });
      
      // Also update the Zustand store when data is loaded
      setDateFormat(
        compensationPlan.dateFormatRegion ?? "default",
        compensationPlan.dateFormatVariant ?? "short"
      );
    }
  }, [compensationPlan, reset, setDateFormat]);

  const mutation = useMutation({
    mutationFn: updateCompensationPlan,
    onMutate: () => setLoading(true),
    onSuccess: (response, variables) => {
      setLoading(false);
      toast({
        title: "Success",
        description: response.data?.message || "Compensation plan saved successfully",
      });
      
      // Update the Zustand store with the new date format values
      setDateFormat(variables.dateFormatRegion, variables.dateFormatVariant);
      
      queryClient.invalidateQueries({ queryKey: ["compensationPlan"] });
    },
    onError: (error: any) => {
      setLoading(false);
      toast({
        title: "Error",
        description: error.message || "Failed to save compensation plan",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (formData: CompensationFormData) => {
    const filteredLevelPercentages = Object.fromEntries(
      Object.entries(formData.levelPercentage).filter(
        ([level]) => parseInt(level) <= formData.numLevels
      )
    );

    mutation.mutate({
      ...formData,
      levelPercentage: filteredLevelPercentages,
    });
  };

  const getFormatExample = (variant: string) => {
    switch (dateFormatRegion) {
      case "US":
        return variant === "short" ? "12/22/2025"
          : variant === "long" ? "December 22, 2025"
          : variant === "datetime" ? "12/22/2025, 04:30 PM"
          : "Dec 22, 2025";
      case "UK":
        return variant === "short" ? "22/12/2025"
          : variant === "long" ? "22 December 2025"
          : variant === "datetime" ? "22/12/2025, 16:30"
          : "Dec 22, 2025";
      case "EU":
        return variant === "short" ? "22.12.2025"
          : variant === "long" ? "22 December 2025"
          : variant === "datetime" ? "22.12.2025, 16:30:45"
          : "Dec 22, 2025";
      case "IN":
        return variant === "short" ? "22-12-2025"
          : variant === "long" ? "22 December 2025"
          : variant === "datetime" ? "22/12/2025, 16:30"
          : "Dec 22, 2025";
      default:
        return variant === "short" ? "2025-12-22"
          : variant === "long" ? "December 22, 2025"
          : variant === "datetime" ? "2025-12-22T16:30:45"
          : "Dec 22, 2025";
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Affiliate Program Configuration</h3>
        <p className="text-sm text-muted-foreground">
          Configure your multi-level affiliate compensation structure
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Number of Levels */}
        <div className="space-y-2">
          <Label htmlFor="num_levels">Number of Levels</Label>
          <Input
            id="num_levels"
            type="number"
            min="1"
            max="10"
            className="max-w-[40%]"
            {...register("numLevels")}
            disabled={!canEdit || isLoading}
          />
          {errors.numLevels && <p className="text-sm text-destructive">{errors.numLevels.message}</p>}
          <p className="text-sm text-muted-foreground">
            Support for up to 10 levels - commission fields will appear dynamically
          </p>
        </div>

        {/* Level Percentages */}
        <div className="space-y-4">
          {Array.from({ length: numLevels }, (_, i) => i + 1).map((level) => (
            <div key={level} className="space-y-2">
              <Label htmlFor={`level_${level}_percentage`}>Level {level} Commission %</Label>
              <Input
                id={`level_${level}_percentage`}
                type="number"
                step="0.01"
                min="0"
                max="100"
                className="max-w-[40%]"
                {...register(`levelPercentage.${level}` as any)}
                disabled={!canEdit || isLoading}
              />
              {errors.levelPercentage?.[level.toString()] && (
                <p className="text-sm text-destructive">
                  {errors.levelPercentage[level.toString()]?.message}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Default Rank Name */}
        <div className="space-y-2">
          <Label htmlFor="default_rank_name">Default Rank Name</Label>
          <Input
            id="default_rank_name"
            className="max-w-[40%]"
            {...register("defaultRankName")}
            placeholder="e.g., Affiliate, Partner, Ambassador"
            disabled={!canEdit || isLoading}
          />
          {errors.defaultRankName && <p className="text-sm text-destructive">{errors.defaultRankName.message}</p>}
          <p className="text-sm text-muted-foreground">The default rank assigned to new affiliates</p>
        </div>

        {/* Date Format Section */}
        <div className="space-y-4 pt-6 border-t">
          <h4 className="text-md font-medium">Date Format Preference</h4>
          <p className="text-sm text-muted-foreground">
            Choose how dates are displayed across the platform
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
            <div className="space-y-2">
              <Label>Region / Style</Label>
              <Controller
                name="dateFormatRegion"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    onValueChange={field.onChange}
                    disabled={!canEdit || isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US">US (MM/DD/YYYY)</SelectItem>
                      <SelectItem value="UK">UK (DD/MM/YYYY)</SelectItem>
                      <SelectItem value="EU">EU (DD.MM.YYYY)</SelectItem>
                      <SelectItem value="IN">India (DD-MM-YYYY)</SelectItem>
                      <SelectItem value="default">Worldwide (YYYY-MM-DD)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Format Type</Label>
              <Controller
                name="dateFormatVariant"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    onValueChange={field.onChange}
                    disabled={!canEdit || isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select format type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Short (e.g., {getFormatExample("short")})</SelectItem>
                      <SelectItem value="long">Long (e.g., {getFormatExample("long")})</SelectItem>
                      <SelectItem value="datetime">Date & Time (e.g., {getFormatExample("datetime")})</SelectItem>
                      <SelectItem value="custom">Custom (e.g., {getFormatExample("custom")})</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Example preview: <strong>{getFormatExample(dateFormatVariant)}</strong>
          </p>
        </div>

        <Button type="submit" disabled={loading || !canEdit || isLoading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Compensation Plan
        </Button>
      </form>
    </div>
  );
}