import { useState } from "react";

export default function Prescription() {
  const [formData, setFormData] = useState({
    patientName: "",
    medicine: "",
    dosage: "",
    duration: "",
    instructions: "",
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
    alert("Prescription Saved Successfully");
  };

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="bg-white shadow-lg rounded-xl p-8">
        <h1 className="text-3xl font-bold mb-6">
          Prescription
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">

          <input
            type="text"
            name="patientName"
            placeholder="Patient Name"
            className="w-full border rounded-lg p-3"
            value={formData.patientName}
            onChange={handleChange}
          />

          <input
            type="text"
            name="medicine"
            placeholder="Medicine Name"
            className="w-full border rounded-lg p-3"
            value={formData.medicine}
            onChange={handleChange}
          />

          <input
            type="text"
            name="dosage"
            placeholder="Dosage (e.g. 1 Tablet)"
            className="w-full border rounded-lg p-3"
            value={formData.dosage}
            onChange={handleChange}
          />

          <input
            type="text"
            name="duration"
            placeholder="Duration (e.g. 5 Days)"
            className="w-full border rounded-lg p-3"
            value={formData.duration}
            onChange={handleChange}
          />

          <textarea
            name="instructions"
            rows="4"
            placeholder="Special Instructions"
            className="w-full border rounded-lg p-3"
            value={formData.instructions}
            onChange={handleChange}
          />

          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg"
          >
            Save Prescription
          </button>

        </form>
      </div>
    </div>
  );
}