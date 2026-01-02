// src/pages/Login.tsx
import { useMutation } from "@tanstack/react-query";
import { login } from "@/api/auth";
import { useAuthStore } from "@/store/useAuthStore";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const loginMutation = useMutation({
    
    mutationFn: login,
    
    onSuccess: (response) => {
      const { token, user } = response.data;
      setAuth(token, user);
      alert(`Welcome back, ${user.name}!`);
      navigate("/company");
    },
    
    onError: (error: any) => {
      alert(error.response?.data?.message || "Invalid email or password");
    },

  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    loginMutation.mutate({
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    });

  };

  return (
    <div style={{ maxWidth: "400px", margin: "100px auto", padding: "20px", border: "1px solid #ddd", borderRadius: "10px" }}>
      <h2>Login to Your Account</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "15px" }}>
          <label>Email</label>
          <input
            name="email"
            type="email"
            required
            style={{ width: "100%", padding: "10px", marginTop: "5px" }}
            placeholder="admin@example.com"
          />
        </div>
        <div style={{ marginBottom: "15px" }}>
          <label>Password</label>
          <input
            name="password"
            type="password"
            required
            style={{ width: "100%", padding: "10px", marginTop: "5px" }}
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          disabled={loginMutation.isPending}
          style={{
            width: "100%",
            padding: "12px",
            background: "#1a1f2e",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "16px",
          }}
        >
          {loginMutation.isPending ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}