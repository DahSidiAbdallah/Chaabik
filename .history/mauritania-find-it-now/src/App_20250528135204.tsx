import SafetyTipsPage from './pages/SafetyTipsPage'; 
import BrowsePage from './pages/BrowsePage'; 
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';

const queryClient = new QueryClient();

<BrowserRouter>
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/police" element={<PolicePage />} />
    <Route path="/create-post" element={<CreatePostPage />} /> 
    <Route path="/safety-tips" element={<SafetyTipsPage />} /> 
    <Route path="/browse" element={<BrowsePage />} /> 
    <Route path="/signin" element={<SignInPage />} />
    <Route path="/signup" element={<SignUpPage />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
</BrowserRouter> 