const DoctorWorkspace = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Doctor Workspace</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white shadow rounded-xl p-5">
          <h2 className="font-semibold text-lg">Today's Patients</h2>
          <p className="text-3xl font-bold text-blue-600 mt-3">18</p>
        </div>

        <div className="bg-white shadow rounded-xl p-5">
          <h2 className="font-semibold text-lg">Pending Reports</h2>
          <p className="text-3xl font-bold text-orange-500 mt-3">5</p>
        </div>

        <div className="bg-white shadow rounded-xl p-5">
          <h2 className="font-semibold text-lg">Completed</h2>
          <p className="text-3xl font-bold text-green-600 mt-3">13</p>
        </div>
      </div>

      <div className="bg-white shadow rounded-xl p-5 mt-6">
        <h2 className="text-xl font-semibold mb-3">Doctor Notes</h2>
        <textarea
          className="w-full border rounded-lg p-3"
          rows="6"
          placeholder="Write notes..."
        />
      </div>
    </div>
  );
};

export default DoctorWorkspace;