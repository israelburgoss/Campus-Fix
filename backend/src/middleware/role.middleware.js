export function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) {
      const error = new Error('No autenticado');
      error.status = 401;
      return next(error);
    }

    if (!roles.includes(req.user.rol)) {
      const error = new Error('No tiene permisos para realizar esta acción');
      error.status = 403;
      return next(error);
    }

    next();
  };
}