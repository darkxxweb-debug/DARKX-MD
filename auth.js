function requireAdmin(req, res, next) {
    if (req.session && req.session.isAdmin) return next();
    return res.redirect('/admin/login');
}

function requireUser(req, res, next) {
    if (req.session && req.session.userPhone) return next();
    return res.redirect('/user/login');
}

module.exports = { requireAdmin, requireUser };
