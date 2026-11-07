const express = require('express');
const { body, param, query } = require('express-validator');
const validate = require('../middleware/validate');
const taskController = require('../controllers/taskController');

const router = express.Router();

// Shared list of allowed values (kept in one place so route rules and the
// Task model never drift apart).
const STATUSES = ['Pending', 'In Progress', 'Completed'];
const PRIORITIES = ['Low', 'Medium', 'High'];

// ---------- validation rules ----------

const createValidators = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 200 })
    .withMessage('Title must be at most 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must be at most 2000 characters'),
  body('status')
    .optional()
    .isIn(STATUSES)
    .withMessage(`Status must be one of: ${STATUSES.join(', ')}`),
  body('priority')
    .optional()
    .isIn(PRIORITIES)
    .withMessage(`Priority must be one of: ${PRIORITIES.join(', ')}`),
];

// For updates every field is optional (you may send only the changed fields),
// but anything you DO send must be valid.
const updateValidators = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ max: 200 })
    .withMessage('Title must be at most 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must be at most 2000 characters'),
  body('status')
    .optional()
    .isIn(STATUSES)
    .withMessage(`Status must be one of: ${STATUSES.join(', ')}`),
  body('priority')
    .optional()
    .isIn(PRIORITIES)
    .withMessage(`Priority must be one of: ${PRIORITIES.join(', ')}`),
];

const listQueryValidators = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100'),
  query('status')
    .optional()
    .isIn(STATUSES)
    .withMessage(`Status must be one of: ${STATUSES.join(', ')}`),
];

// Rejects anything that is not a real 24-character MongoDB ObjectId,
// so bad ids never reach findById (which would throw a CastError).
const idValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid task ID'),
];

// ---------- routes ----------

router.get('/', listQueryValidators, validate, taskController.getTasks);
router.get('/:id', idValidator, validate, taskController.getTaskById);
router.post('/', createValidators, validate, taskController.createTask);
router.put('/:id', idValidator, updateValidators, validate, taskController.updateTask);
router.delete('/:id', idValidator, validate, taskController.deleteTask);

module.exports = router;
