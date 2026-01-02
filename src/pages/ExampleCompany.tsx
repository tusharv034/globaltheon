// src/pages/Company.tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCompany, updateCompany } from "@/api/company";
import { useCompanyStore } from "@/store/useCompanyStore";
import { useAuthStore } from "@/store/useAuthStore";

export default function Company() {
  const queryClient = useQueryClient();
  const { company, isEditing, setCompany, toggleEdit } = useCompanyStore();
  const { user } = useAuthStore();

  // Fetch company data
  const { data, isLoading } = useQuery({
    queryKey: ["company"],
    queryFn: getCompany,
    onSuccess: (res) => {
      setCompany(res.data.company);
    },
  });

  // Update company
  const updateMutation = useMutation({
    mutationFn: updateCompany,
    onSuccess: (res) => {
      setCompany(res.data.company);
      toggleEdit(); // close edit mode
      queryClient.invalidateQueries({ queryKey: ["company"] });
      alert("Company updated successfully!");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({
      name: formData.get("name") as string,
      supportEmail: formData.get("supportEmail") as string,
    });
  };

  if (isLoading) return <div>Loading company...</div>;

  return (
    <div style={{ padding: "40px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Company Settings</h1>
      <p>Welcome, <strong>{user?.name}</strong> ({user?.role})</p>

      <div style={{ background: "#f9f9f9", padding: "20px", borderRadius: "10px", marginTop: "20px" }}>
        {isEditing ? (
          <form onSubmit={handleSubmit}>
            <h3>Edit Company</h3>
            <input
              name="name"
              defaultValue={company?.name}
              required
              style={{ width: "100%", padding: "10px", margin: "10px 0" }}
            />
            <input
              name="supportEmail"
              type="email"
              defaultValue={company?.supportEmail}
              required
              style={{ width: "100%", padding: "10px", margin: "10px 0" }}
            />
            <div>
              <button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
              <button type="button" onClick={toggleEdit} style={{ marginLeft: "10px" }}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div>
            <h3>{company?.name}</h3>
            <p>Email: Tisch {company?.supportEmail}</p>
            <p>Logo: {company?.logo ? <img src={company.logo} width="100" /> : "No logo"}</p>
            <button onClick={toggleEdit}>Edit Company</button>
          </div>
        )}
      </div>
    </div>
  );
}