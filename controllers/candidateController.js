const Candidate = require('../models/Candidate');

// Create a new candidate
exports.createCandidate = async (req, res) => {
  try {
    const candidate = new Candidate({
      CFF: req.body.CFF,
      First_Name: req.body.First_Name,
      Last_Name: req.body.Last_Name,
      Gender: req.body.Gender,
      Nationality: req.body.Nationality,
      Sector: req.body.Sector,
      Observation: req.body.Observation,
      Note: req.body.Note,
      hometown: req.body.hometown,
      school_criteria: req.body.school_criteria,
      family_criteria: req.body.family_criteria,
      social_criteria: req.body.social_criteria,
      physical_criteria: req.body.physical_criteria,
      geographic_criteria: req.body.geographic_criteria,
      phoneNumber: req.body.phoneNumber, // Added phoneNumber
      parentPhoneNumber: req.body.parentPhoneNumber, // Added parentPhoneNumber
    });

    const savedCandidate = await candidate.save();
    res.status(201).json({
      success: true,
      data: savedCandidate,
      message: 'Candidate created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get all candidates
exports.getAllCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.find();
    res.status(200).json({
      success: true,
      count: candidates.length,
      data: candidates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get a single candidate by ID
exports.getCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }
    res.status(200).json({
      success: true,
      data: candidate
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update candidate status
exports.updateCandidateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["candidate", "selected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value. Must be 'candidate' or 'selected'",
      });
    }

    const candidate = await Candidate.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    res.status(200).json({
      success: true,
      data: candidate,
      message: "Candidate status updated successfully",
    });
  } catch (error) {
    console.error("Error updating candidate status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update candidate status",
      error: error.message,
    });
  }
};

// Update a candidate
exports.updateCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    const updatedCandidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          CFF: req.body.CFF || candidate.CFF,
          First_Name: req.body.First_Name || candidate.First_Name,
          Last_Name: req.body.Last_Name || candidate.Last_Name,
          Gender: req.body.Gender || candidate.Gender,
          Nationality: req.body.Nationality || candidate.Nationality,
          Sector: req.body.Sector || candidate.Sector,
          Observation: req.body.Observation || candidate.Observation,
          Note: req.body.Note || candidate.Note,
          hometown: req.body.hometown || candidate.hometown,
          school_criteria: req.body.school_criteria || candidate.school_criteria,
          family_criteria: req.body.family_criteria || candidate.family_criteria,
          social_criteria: req.body.social_criteria || candidate.social_criteria,
          physical_criteria: req.body.physical_criteria || candidate.physical_criteria,
          geographic_criteria: req.body.geographic_criteria || candidate.geographic_criteria,
          phoneNumber: req.body.phoneNumber || candidate.phoneNumber, // Added phoneNumber
          parentPhoneNumber: req.body.parentPhoneNumber || candidate.parentPhoneNumber, // Added parentPhoneNumber
        }
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedCandidate,
      message: 'Candidate updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete a candidate
exports.deleteCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    await Candidate.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Candidate deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};