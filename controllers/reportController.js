const Report = require('../models/Report');
const Intern = require('../models/Intern');
const Deputydirector = require('../models/Deputydirector');
const Chef = require('../models/Chef');

// Submit a report (intern, Deputydirector, or Chef)
exports.submitReport = async (req, res) => {
  try {
    const { reportType, description } = req.body;
    const userId = req.user.id; // From auth middleware
    const userRole = req.user.role;

    if (!reportType || !description) {
      return res.status(400).json({
        success: false,
        message: 'reportType et description sont requis',
      });
    }

    let reportData = { reportType, description, submitterRole: userRole };

    // Assign the appropriate ID field based on role
    switch (userRole) {
      case 'intern':
        const intern = await Intern.findById(userId);
        if (!intern) return res.status(404).json({ message: 'intern non trouvé' });
        reportData.internId = userId;
        break;
      case 'Deputydirector':
        const deputy = await Deputydirector.findById(userId);
        if (!deputy) return res.status(404).json({ message: 'Deputy Director non trouvé' });
        reportData.deputyDirectorId = userId;
        break;
      case 'Chef':
        const chef = await Chef.findById(userId);
        if (!chef) return res.status(404).json({ message: 'Chef non trouvé' });
        reportData.chefId = userId;
        break;
      default:
        return res.status(403).json({ message: 'Rôle non autorisé à soumettre un rapport' });
    }

    const report = new Report(reportData);
    await report.save();

    res.status(201).json({
      success: true,
      data: report,
      message: 'Rapport soumis avec succès',
    });
  } catch (error) {
    console.error('Erreur lors de la soumission du rapport:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la soumission du rapport',
      error: error.message,
    });
  }
};

// Get all reports (Super Admin only)
exports.getAllReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('internId', 'First_Name Last_Name email')
      .populate('deputyDirectorId', 'name email')
      .populate('chefId', 'firstName lastName email');

    res.status(200).json({
      success: true,
      data: reports,
      message: 'Rapports récupérés avec succès',
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des rapports:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des rapports',
      error: error.message,
    });
  }
};

// Update a report (Submitter or Super Admin)
exports.updateReport = async (req, res) => {
  try {
    const { reportId, reportType, description } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!reportId) {
      return res.status(400).json({ success: false, message: 'reportId est requis' });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Rapport non trouvé' });
    }

    // Check if the user is the submitter or Super Admin
    const isSubmitter =
      (report.submitterRole === 'intern' && report.internId.toString() === userId) ||
      (report.submitterRole === 'Deputydirector' && report.deputyDirectorId.toString() === userId) ||
      (report.submitterRole === 'Chef' && report.chefId.toString() === userId);
    const isSuperAdmin = userRole === 'Superadmin';

    if (!isSubmitter && !isSuperAdmin) {
      return res.status(403).json({ success: false, message: 'Non autorisé à modifier ce rapport' });
    }

    // Update only provided fields
    if (reportType) report.reportType = reportType;
    if (description) report.description = description;

    await report.save();

    res.status(200).json({
      success: true,
      data: report,
      message: 'Rapport mis à jour avec succès',
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du rapport:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du rapport',
      error: error.message,
    });
  }
};

// Delete a report (Submitter or Super Admin)
exports.deleteReport = async (req, res) => {
  try {
    const { reportId } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!reportId) {
      return res.status(400).json({ success: false, message: 'reportId est requis' });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Rapport non trouvé' });
    }

    // Check if the user is the submitter or Super Admin
    const isSubmitter =
      (report.submitterRole === 'intern' && report.internId.toString() === userId) ||
      (report.submitterRole === 'Deputydirector' && report.deputyDirectorId.toString() === userId) ||
      (report.submitterRole === 'Chef' && report.chefId.toString() === userId);
    const isSuperAdmin = userRole === 'Superadmin';

    if (!isSubmitter && !isSuperAdmin) {
      return res.status(403).json({ success: false, message: 'Non autorisé à supprimer ce rapport' });
    }

    await Report.deleteOne({ _id: reportId });

    res.status(200).json({
      success: true,
      message: 'Rapport supprimé avec succès',
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du rapport:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du rapport',
      error: error.message,
    });
  }
};
// Add to reportController.js
exports.getMyReports = async (req, res) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
  
      let query;
      switch (userRole) {
        case 'intern':
          query = { submitterRole: 'intern', internId: userId };
          break;
        case 'Deputydirector':
          query = { submitterRole: 'Deputydirector', deputyDirectorId: userId };
          break;
        case 'Chef':
          query = { submitterRole: 'Chef', chefId: userId };
          break;
        default:
          return res.status(403).json({ success: false, message: 'Rôle non autorisé' });
      }
  
      const reports = await Report.find(query);
      res.status(200).json({
        success: true,
        data: reports,
        message: 'Rapports récupérés avec succès',
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des rapports:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des rapports',
        error: error.message,
      });
    }
  };

module.exports = exports;