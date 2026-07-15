const MedicalHistory = () => {
  const records = [
    {
      id: 1,
      date: "12-07-2026",
      doctor: "Dr. Sharma",
      diagnosis: "Fever",
      prescription: "Paracetamol",
    },
    {
      id: 2,
      date: "20-06-2026",
      doctor: "Dr. Patel",
      diagnosis: "Headache",
      prescription: "Ibuprofen",
    },
    {
      id: 3,
      date: "15-05-2026",
      doctor: "Dr. Khan",
      diagnosis: "Cold & Cough",
      prescription: "Cough Syrup",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Medical History</h1>

      <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
        <table className="min-w-full border-collapse">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="p-4 text-left">Date</th>
              <th className="p-4 text-left">Doctor</th>
              <th className="p-4 text-left">Diagnosis</th>
              <th className="p-4 text-left">Prescription</th>
            </tr>
          </thead>

          <tbody>
            {records.map((record) => (
              <tr key={record.id} className="border-b hover:bg-gray-100">
                <td className="p-4">{record.date}</td>
                <td className="p-4">{record.doctor}</td>
                <td className="p-4">{record.diagnosis}</td>
                <td className="p-4">{record.prescription}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MedicalHistory;