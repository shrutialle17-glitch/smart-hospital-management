import { useState } from "react";

export default function Diagnosis() {
  const [diagnosis, setDiagnosis] = useState({
    patientName: "",
    symptoms: "",
    diagnosis: "",
    notes: "",
  });

  const handleChange = (e) => {
    setDiagnosis({
      ...diagnosis,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(diagnosis);
    alert("Diagnosis Saved Successfully");
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Patient Diagnosis</h1>

      <form onSubmit={handleSubmit} className="space-y-5">

        <input
          type="text"
          name="patientName"
          placeholder="Patient Name"
          className="w-full border rounded-lg p-3"
          onChange={handleChange}
        />

        <textarea
          name="symptoms"
          placeholder="Symptoms"
          rows="4"
          className="w-full border rounded-lg p-3"
          onChange={handleChange}
        />

        <textarea
          name="diagnosis"
          placeholder="Diagnosis"
          rows="4"
          className="w-full border rounded-lg p-3"
          onChange={handleChange}
        />

        <textarea
          name="notes"
          placeholder="Additional Notes"
          rows="4"
          className="w-full border rounded-lg p-3"
          onChange={handleChange}
        />

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
        >
          Save Diagnosis
        </button>

      </form>
    </div>
  );
}