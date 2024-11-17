const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
    const user = await User.findOne({ username });
    if (!user) {
        return res.status(401).send({ message: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).send({ message: 'Invalid username or password' });
    }

    // Generate JWT
    const token = jwt.sign({ id: user._id, role: user.role }, 'your-secret-key', { expiresIn: '1h' });

    res.cookie('token', token, { httpOnly: true });
    res.send({ message: 'Login successful', role: user.role });
    } catch (error) {
    res.status(500).send({ message: 'Internal server error' });
    }
});
