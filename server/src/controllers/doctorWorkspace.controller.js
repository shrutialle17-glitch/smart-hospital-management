export const getDoctorWorkspace = async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Doctor Workspace fetched successfully",
    data: [],
  });
};

export const updateDoctorWorkspace = async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Doctor Workspace updated successfully",
  });
};