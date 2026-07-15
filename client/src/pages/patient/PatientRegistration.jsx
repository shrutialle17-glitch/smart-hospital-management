import { useState } from "react";

const PatientRegistration = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: "",
    dob: "",
    bloodGroup: "",
    address: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(formData);
    alert("Patient Registered Successfully");
  };

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Patient Registration</h1>

      <form onSubmit={handleSubmit} className="space-y-4">

        <input
          type="text"
          name="firstName"
          placeholder="First Name"
          className="w-full border p-3 rounded"
          onChange={handleChange}
        />

        <input
          type="text"
          name="lastName"
          placeholder="Last Name"
          className="w-full border p-3 rounded"
          onChange={handleChange}
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          className="w-full border p-3 rounded"
          onChange={handleChange}
        />

        <input
          type="text"
          name="phone"
          placeholder="Phone Number"
          className="w-full border p-3 rounded"
          onChange={handleChange}
        />

        <select
          name="gender"
          className="w-full border p-3 rounded"
          onChange={handleChange}
        >
          <option value="">Select Gender</option>
          <option>Male</option>
          <option>Female</option>
          <option>Other</option>
        </select>

        <input
          type="date"
          name="dob"
          className="w-full border p-3 rounded"
          onChange={handleChange}
        />

        <select
          name="bloodGroup"
          className="w-full border p-3 rounded"
          onChange={handleChange}
        >
          <option value="">Blood Group</option>
          <option>A+</option>
          <option>A-</option>
          <option>B+</option>
          <option>B-</option>
          <option>AB+</option>
          <option>AB-</option>
          <option>O+</option>
          <option>O-</option>
        </select>

        <textarea
          name="address"
          placeholder="Address"
          className="w-full border p-3 rounded"
          rows="4"
          onChange={handleChange}
        />

        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
        >
          Register Patient
        </button>

      </form>
    </div>
  );
};

export default PatientRegistration;