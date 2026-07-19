const LiveQueue = () => {
  const patients = [
    { id: 1, name: "Rahul Sharma", status: "Waiting" },
    { id: 2, name: "Priya Patel", status: "In Consultation" },
    { id: 3, name: "Amit Singh", status: "Completed" },
  ];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Live Queue</h1>

      <table className="w-full border shadow rounded-xl">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 text-left">Token</th>
            <th className="p-3 text-left">Patient</th>
            <th className="p-3 text-left">Status</th>
          </tr>
        </thead>

        <tbody>
          {patients.map((patient) => (
            <tr key={patient.id} className="border-t">
              <td className="p-3">{patient.id}</td>
              <td className="p-3">{patient.name}</td>
              <td className="p-3">{patient.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LiveQueue;