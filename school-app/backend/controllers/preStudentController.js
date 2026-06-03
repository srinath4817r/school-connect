const PreRegisteredStudent = require('../models/PreRegisteredStudent');
const School = require('../models/School');
const User = require('../models/User');
const Notification = require('../models/Notification');
const pdfParse = require('pdf-parse');

// @route   GET /api/admin/pre-students
// @desc    Get all pre-registered students for the logged-in admin's/principal's school
// @access  Private (Admins & Principals)
exports.getPreStudents = async (req, res) => {
  try {
    const requesterRole = req.user.role;
    let schoolId = null;

    if (requesterRole === 'school_admin' || requesterRole === 'principal') {
      schoolId = req.user.school;
    } else if (requesterRole === 'super_admin') {
      schoolId = req.query.schoolId;
    }

    if (!schoolId) {
      return res.status(400).json({ status: 'error', message: 'School ID is required' });
    }

    const students = await PreRegisteredStudent.find({ school: schoolId })
      .populate('parent', 'fullName email')
      .sort({ className: 1, section: 1, name: 1 });

    res.status(200).json({ status: 'success', students });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// @route   POST /api/admin/pre-students/batch
// @desc    Batch upsert pre-registered student directory logs
// @access  Private (Admins & Principals)
exports.batchUpsertPreStudents = async (req, res) => {
  try {
    const { students, schoolId } = req.body;
    const requesterRole = req.user.role;
    let targetSchoolId = null;

    if (requesterRole === 'school_admin' || requesterRole === 'principal') {
      targetSchoolId = req.user.school;
    } else if (requesterRole === 'super_admin') {
      targetSchoolId = schoolId;
    }

    if (!targetSchoolId) {
      return res.status(400).json({ status: 'error', message: 'Target School ID is required' });
    }

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Students array must be provided and cannot be empty' });
    }

    const results = [];
    for (const student of students) {
      const { name, admissionNumber, className, section } = student;
      if (!name || !admissionNumber || !className || !section) {
        continue;
      }

      // Upsert: unique by school & admissionNumber
      const updatedStudent = await PreRegisteredStudent.findOneAndUpdate(
        { school: targetSchoolId, admissionNumber: admissionNumber.trim() },
        {
          name: name.trim(),
          className: className.trim(),
          section: section.trim().toUpperCase()
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      results.push(updatedStudent);
    }

    if (results.length > 0) {
      try {
        const studentNames = results.map(s => s.name).join(', ');
        const message = results.length === 1 
          ? `New student "${results[0].name}" has been pre-registered for Class ${results[0].className} ${results[0].section}.`
          : `${results.length} new students (${studentNames}) have been pre-registered for your school.`;

        // Create notification for school admin
        await Notification.create({
          school: targetSchoolId,
          sender: req.user._id,
          recipientRole: 'school_admin',
          type: 'general',
          message
        });

        // Create notification for principal
        await Notification.create({
          school: targetSchoolId,
          sender: req.user._id,
          recipientRole: 'principal',
          type: 'general',
          message
        });
      } catch (notificationError) {
        console.error('Failed to create pre-student notifications:', notificationError);
      }
    }

    res.status(200).json({
      status: 'success',
      message: `Successfully processed ${results.length} students.`,
      count: results.length
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// @route   DELETE /api/admin/pre-students/:id
// @desc    Delete pre-registered student record
// @access  Private (Admins & Principals)
exports.deletePreStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const requesterRole = req.user.role;

    const student = await PreRegisteredStudent.findById(id);
    if (!student) {
      return res.status(404).json({ status: 'error', message: 'Student record not found' });
    }

    // Verify permission: school admin & principal can only delete their own school's records
    if (requesterRole !== 'super_admin' && student.school.toString() !== req.user.school.toString()) {
      return res.status(403).json({ status: 'error', message: 'Forbidden: Access denied' });
    }

    // If parent is linked, unassign class/section and reference
    if (student.parent) {
      await User.findByIdAndUpdate(student.parent, {
        classAssigned: null,
        sectionAssigned: null
      });
    }

    await PreRegisteredStudent.deleteOne({ _id: id });

    res.status(200).json({ status: 'success', message: 'Student record deleted successfully' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// @route   POST /api/admin/pre-students/extract-pdf
// @desc    Extract student list details from directory PDF
// @access  Private (Admins & Principals)
exports.extractPdfStudents = async (req, res) => {
  try {
    const { pdfBase64 } = req.body;
    if (!pdfBase64) {
      return res.status(400).json({ status: 'error', message: 'PDF Base64 data is required' });
    }

    // Convert base64 to buffer
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    
    // Parse text
    const data = await pdfParse(pdfBuffer);
    const text = data.text;

    // Helper parser
    const parsedStudents = parseStudentDirectoryText(text);

    res.status(200).json({
      status: 'success',
      students: parsedStudents
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: `Failed to extract PDF: ${error.message}` });
  }
};

// @route   GET /api/schools/:schoolId/pre-students
// @desc    Get all unassigned pre-registered students in a school for parents registration
// @access  Public
exports.getPublicPreStudents = async (req, res) => {
  try {
    const { schoolId } = req.params;
    if (!schoolId) {
      return res.status(400).json({ status: 'error', message: 'School ID is required' });
    }

    const students = await PreRegisteredStudent.find({ school: schoolId, parent: null })
      .select('name admissionNumber className section')
      .sort({ className: 1, section: 1, name: 1 });

    res.status(200).json({ status: 'success', students });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Helper parser to extract structured entries from raw text layout
const parseStudentDirectoryText = (text) => {
  const lines = text.split('\n');
  const students = [];

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    const lowerLine = line.toLowerCase();
    // Skip headers, footers and noise lines
    if (
      lowerLine.includes('student list') ||
      lowerLine.includes('student directory') ||
      lowerLine.includes('admission number') ||
      lowerLine.includes('roll number') ||
      lowerLine.includes('page ') ||
      lowerLine.includes('report date') ||
      lowerLine.includes('class list')
    ) {
      continue;
    }

    // 1. Identify Class (8, 9, 10, 11, 12)
    let className = 'Class 8';
    let classMatch = line.match(/(?:Class|Grade|Gr)?\s*\b(8|9|10|11|12)\b/i);
    if (classMatch) {
      className = `Class ${classMatch[1]}`;
    }

    // 2. Identify Section (A-G)
    let section = 'A';
    // Try to match section linked to class, e.g. "Class 8 A", "8-A", "Class 9 - B"
    let sectionMatch = line.match(/(?:Class|Grade|Gr)?\s*\b(?:8|9|10|11|12)\b\s*[-–]?\s*\b([A-G])\b/i);
    if (!sectionMatch) {
      // Find any standalone character A-G
      sectionMatch = line.match(/\b([A-G])\b/i);
    }
    if (sectionMatch) {
      section = sectionMatch[1].toUpperCase();
    }

    // 3. Find Admission Number
    // Scan words for token containing at least one digit and length between 3 and 15
    let admissionNumber = '';
    const words = line.split(/\s+/);
    for (const word of words) {
      const cleanedWord = word.replace(/[,;|()]/g, '');
      if (/\d/.test(cleanedWord) && cleanedWord.length >= 3 && cleanedWord.length <= 15) {
        admissionNumber = cleanedWord;
        break;
      }
    }

    if (!admissionNumber) {
      // Try to find first sequence of digits of length 3-10
      const numMatch = line.match(/\b\d{3,10}\b/);
      if (numMatch) {
        admissionNumber = numMatch[0];
      }
    }

    // Skip line if no admission number detected
    if (!admissionNumber) continue;

    // 4. Extract Name
    // Remove the matches of admissionNumber, class, and section
    let nameText = line;
    nameText = nameText.replace(admissionNumber, '');
    if (classMatch) {
      nameText = nameText.replace(classMatch[0], '');
    }
    if (sectionMatch) {
      nameText = nameText.replace(new RegExp(`\\b${sectionMatch[1]}\\b`, 'i'), '');
    }

    // Clean remaining punctuation and reduce spacing
    nameText = nameText.replace(/[,;|/:\-_+=#*]/g, ' ');
    nameText = nameText.replace(/\s+/g, ' ').trim();

    if (nameText.length < 2) continue;

    students.push({
      name: nameText,
      admissionNumber,
      className,
      section
    });
  }

  return students;
};
