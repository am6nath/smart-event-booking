const bcrypt = require('bcryptjs');

const generateHash = async () => {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('admin123', salt);
  console.log('\n✅ Copy this hash:\n', hash, '\n');
};

generateHash();