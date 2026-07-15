const PatientProfile = () => {
  return (
    <div className="max-w-5xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Patient Profile</h1>

      <div className="bg-white shadow-lg rounded-xl p-8">

        <div className="grid grid-cols-2 gap-6">

          <div>
            <label className="font-semibold">First Name</label>
            <input
              type="text"
              value="Samridhi"
              className="w-full border rounded p-3 mt-2"
              readOnly
            />
          </div>

          <div>
            <label className="font-semibold">Last Name</label>
            <input
              type="text"
              value="Pandey"
              className="w-full border rounded p-3 mt-2"
              readOnly
            />
          </div>

          <div>
            <label className="font-semibold">Email</label>
            <input
              type="email"
              value="samridhi@gmail.com"
              className="w-full border rounded p-3 mt-2"
              readOnly
            />
          </div>

          <div>
            <label className="font-semibold">Phone</label>
            <input
              type="text"
              value="9876543210"
              className="w-full border rounded p-3 mt-2"
              readOnly
            />
          </div>

          <div>
            <label className="font-semibold">Gender</label>
            <input
              type="text"
              value="Female"
              className="w-full border rounded p-3 mt-2"
              readOnly
            />
          </div>

          <div>
            <label className="font-semibold">Blood Group</label>
            <input
              type="text"
              value="O+"
              className="w-full border rounded p-3 mt-2"
              readOnly
            />
          </div>

          <div className="col-span-2">
            <label className="font-semibold">Address</label>
            <textarea
              className="w-full border rounded p-3 mt-2"
              rows="3"
              readOnly
              value="Mumbai, Maharashtra"
            />
          </div>

        </div>

        <button className="mt-8 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
          Edit Profile
        </button>

      </div>
    </div>
  );
};

export default PatientProfile;