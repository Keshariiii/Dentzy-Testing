import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dentist',
      required: true,
    },
    patientName:  { type: String, required: true, trim: true },
    caseId:       { type: String, required: true, trim: true },
    invoiceNumber:{ type: String, trim: true },
    amount:       { type: Number, required: true, min: 0 },
    currency:     { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['Paid', 'Pending', 'Overdue', 'Cancelled'],
      default: 'Pending',
    },
    invoiceDate:  { type: Date, default: Date.now },
    dueDate:      { type: Date },
    description:  { type: String, default: '' },
  },
  { timestamps: true }
);

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
