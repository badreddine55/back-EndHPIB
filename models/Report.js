const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  submitterRole: { 
    type: String, 
    enum: ['intern', 'Deputydirector', 'Chef'], 
    required: true 
  },
  internId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Intern', 
    required: function () { return this.submitterRole === 'intern'; } 
  },
  deputyDirectorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Deputydirector', 
    required: function () { return this.submitterRole === 'Deputydirector'; } 
  },
  chefId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Chef', 
    required: function () { return this.submitterRole === 'Chef'; } 
  },
  reportType: { 
    type: String, 
    enum: ['réclamation', 'remarque'], 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
}, { timestamps: true });

module.exports = mongoose.model('Report', ReportSchema);