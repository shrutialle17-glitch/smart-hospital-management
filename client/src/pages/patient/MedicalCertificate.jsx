export default function MedicalCertificate() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-8">
        Medical Certificate
      </h1>

      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-xl font-semibold mb-4">
          Certificate Details
        </h2>

        <p><strong>Patient:</strong> Rahul Sharma</p>
        <p><strong>Doctor:</strong> Dr. Sharma</p>
        <p><strong>Date:</strong> 20 July 2026</p>

        <button className="mt-6 bg-blue-600 text-white px-5 py-2 rounded-lg">
          Download PDF
        </button>
      </div>
    </div>
  );
}