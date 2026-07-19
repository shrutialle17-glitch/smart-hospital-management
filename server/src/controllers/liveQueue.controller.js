export const getLiveQueue = async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Live Queue fetched successfully",
    data: [],
  });
};

export const addPatientToQueue = async (req, res) => {
  res.status(201).json({
    success: true,
    message: "Patient added to Live Queue",
  });
};