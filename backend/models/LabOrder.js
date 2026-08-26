import mongoose from 'mongoose';

const STAGES = ['received', 'design', 'production', 'qc', 'dispatched', 'completed'];

const labOrderSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    patientName: { type: String, required: true, trim: true },
    caseId:      { type: String, required: true, trim: true, unique: true, index: true },
    serviceType: {
      type: String,
      enum: ['Crown', 'Bridge', 'Denture', 'Implant', 'Veneer', 'Retainer', 'Other'],
      default: 'Other',
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
    stage: {
      type: String,
      enum: STAGES,
      default: 'received',
    },
    dueDate:  { type: Date },
    notes:    { type: String, default: '' },
    priority: { type: String, enum: ['Low', 'Normal', 'High', 'Urgent'], default: 'Normal' },
    createdBy: { type: String, default: 'admin' }, // 'admin' or 'dentist'
  },
  { timestamps: true }
);

// Auto-sync status from stage on save
labOrderSchema.pre('save', function (next) {
  if (this.isModified('stage')) {
    const stg = this.stage;
    if (stg === 'completed') {
      this.status = 'Completed';
    } else if (stg === 'received') {
      this.status = 'Pending';
    } else {
      this.status = 'In Progress';
    }
  }
  next();
});

const LabOrder = mongoose.model('LabOrder', labOrderSchema);
export { STAGES };
export default LabOrder;
