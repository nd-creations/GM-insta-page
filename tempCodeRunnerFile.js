// Serve uploaded media
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
// Routes
app.use('/auth', require('./routes/authRoutes'));
app.use('/posts', require('./routes/postRoutes'));
app.use('/comments', require('./routes/commentRoutes'));
app.use('/chat', require('./routes/chatRoutes'));