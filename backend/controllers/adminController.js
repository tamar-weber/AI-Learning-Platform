const adminService = require('../models/adminService');

async function getUsers(req, res, next) {
    try {
        const users = await adminService.getAllUsers();
        res.json(users);
    } catch (error) {
        next(error);
    }
}

async function deleteUser(req, res, next) {
    try {
        const result = await adminService.deleteUser(req.params.userId);
        res.json(result);
    } catch (error) {
        next(error);
    }
}

async function getUserById(req, res, next) {
    try {
        const user = await adminService.getUserById(req.params.userId);
        res.json(user);
    } catch (error) {
        next(error);
    }
}

async function getAllPrompts(req, res, next) {
    try {
        const prompts = await adminService.getAllPrompts();
        res.json(prompts);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getUsers,
    getUserById,
    getAllPrompts,
    deleteUser
};
