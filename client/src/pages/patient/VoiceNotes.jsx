export default function VoiceNotes() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-6">
        Voice Notes
      </h1>

      <div className="bg-white rounded-xl shadow-lg p-8">
        <button className="bg-red-600 text-white px-6 py-3 rounded-lg">
          🎤 Start Recording
        </button>

        <p className="mt-6 text-gray-600">
          Voice recordings will appear here.
        </p>
      </div>
    </div>
  );
}