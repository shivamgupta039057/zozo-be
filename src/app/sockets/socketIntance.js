let io = null;

module.exports = {
  setIO: (_io) => {
    io = _io;
  },
  getIO: () => {
    if (!io) {
      return null;
    }
    return io;
  }
};
