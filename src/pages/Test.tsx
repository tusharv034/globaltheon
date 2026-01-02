import { useState } from "react";

export default function Test() {
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const rules = {
    length: password.length >= 6,
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const allValid =
    Object.values(rules).every(Boolean) &&
    password === confirm &&
    current.length > 0;

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-xl font-semibold">Change Password</h2>
      <p className="text-sm text-gray-500 mb-6">
        Choose a strong password to keep your account secure
      </p>

      <input
        type="password"
        placeholder="Current Password"
        className="input"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
      />

      <input
        type="password"
        placeholder="New Password"
        className="input mt-4"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <ul className="text-sm mt-3 space-y-1">
        {[
          ["At least 6 characters", rules.length],
          ["1 uppercase letter", rules.uppercase],
          ["1 number", rules.number],
          ["1 special character", rules.special],
        ].map(([label, ok]) => (
          <li key={label} className={ok ? "text-green-600" : "text-gray-400"}>
            {ok ? "✔" : "•"} {label}
          </li>
        ))}
      </ul>

      <input
        type="password"
        placeholder="Confirm New Password"
        className="input mt-4"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />

      {confirm && password !== confirm && (
        <p className="text-red-500 text-sm mt-1">
          Passwords do not match
        </p>
      )}

      <button
        disabled={!allValid}
        className={`btn-primary mt-6 w-full ${
          !allValid && "opacity-50 cursor-not-allowed"
        }`}
      >
        Update Password
      </button>
    </div>
  );
}
