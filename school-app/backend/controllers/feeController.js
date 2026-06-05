const Fee = require('../models/Fee');
const User = require('../models/User');
const Notification = require('../models/Notification');

// 1. Get child's fee details (Parent only)
exports.getStudentFee = async (req, res) => {
  try {
    const studentId = req.user._id;
    let fee = await Fee.findOne({ student: studentId });

    if (!fee) {
      // Return null so the frontend knows that fee details are not uploaded yet
      return res.status(200).json({ status: 'success', fee: null });
    }

    res.status(200).json({ status: 'success', fee });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 2. Update a student's billing statement (Admin / Principal only)
exports.updateStudentFee = async (req, res) => {
  try {
    const { studentId, totalAmount, paidAmount, dueDate, officePhone } = req.body;

    if (!studentId || totalAmount === undefined || paidAmount === undefined || !dueDate || !officePhone) {
      return res.status(400).json({ status: 'error', message: 'All billing details are required' });
    }

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ status: 'error', message: 'Student account not found' });
    }

    const fee = await Fee.findOneAndUpdate(
      { student: studentId },
      {
        student: studentId,
        school: req.user.school,
        totalAmount: Number(totalAmount),
        paidAmount: Number(paidAmount),
        dueDate: new Date(dueDate),
        officePhone: officePhone.trim()
      },
      { upsert: true, new: true, runValidators: true }
    );

    // Create Parent Notification for Fee Details Updated
    try {
      const cleanDueDate = new Date(dueDate).toLocaleDateString();
      const pendingAmount = Number(totalAmount) - Number(paidAmount);
      const message = `Fee Details Updated: Your fee details have been updated. Total: ₹${totalAmount}, Paid: ₹${paidAmount}, Pending: ₹${pendingAmount}, Due Date: ${cleanDueDate}.`;

      const newNotification = new Notification({
        school: req.user.school,
        sender: req.user._id,
        recipient: studentId,
        type: 'general',
        message
      });
      await newNotification.save();
    } catch (err) {
      console.error('Failed to create fee parent notification:', err);
    }

    res.status(200).json({ status: 'success', message: 'Billing statement updated successfully', fee });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 3. Simulate parent making a fee payment online (Parent only)
exports.simulateFeePayment = async (req, res) => {
  try {
    const { payAmount } = req.body;
    const studentId = req.user._id;

    if (!payAmount || Number(payAmount) <= 0) {
      return res.status(400).json({ status: 'error', message: 'Invalid payment amount' });
    }

    const fee = await Fee.findOne({ student: studentId });
    if (!fee) {
      return res.status(404).json({ status: 'error', message: 'No fee account found to pay' });
    }

    if (fee.pendingAmount < payAmount) {
      return res.status(400).json({ status: 'error', message: 'Payment amount exceeds pending balance' });
    }

    fee.paidAmount += Number(payAmount);
    await fee.save();

    res.status(200).json({ 
      status: 'success', 
      message: `Simulated payment of ₹${payAmount} completed successfully. Balance updated.`,
      fee 
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 4. Get all student fee accounts for school dashboard (Admin / Principal only)
exports.getSchoolFeesList = async (req, res) => {
  try {
    const schoolId = req.user.school;

    // Fetch all student accounts
    const students = await User.find({ school: schoolId, role: 'parent' })
      .select('fullName email classAssigned sectionAssigned')
      .populate('classAssigned', 'name')
      .sort({ fullName: 1 });

    const fees = await Fee.find({ school: schoolId });

    // Combine them
    const studentBills = students.map(student => {
      const bill = fees.find(f => f.student.toString() === student._id.toString());
      return {
        studentId: student._id,
        fullName: student.fullName,
        email: student.email,
        class: student.classAssigned ? student.classAssigned.name : 'N/A',
        section: student.sectionAssigned || 'N/A',
        totalAmount: bill ? bill.totalAmount : 0,
        paidAmount: bill ? bill.paidAmount : 0,
        pendingAmount: bill ? bill.pendingAmount : 0,
        dueDate: bill ? bill.dueDate : null,
        officePhone: bill ? bill.officePhone : '+91 80 2345 6789'
      };
    });

    res.status(200).json({ status: 'success', fees: studentBills });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
