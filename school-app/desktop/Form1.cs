using System;
using System.Drawing;
using System.Windows.Forms;
using Microsoft.Web.WebView2.WinForms;

namespace SchoolConnectPC;

public partial class Form1 : Form
{
    private WebView2? _webView;

    public Form1()
    {
        InitializeComponent();
        InitializeWebView();
    }

    private async void InitializeWebView()
    {
        // Configure window properties
        this.Text = "School Connect";
        this.WindowState = FormWindowState.Maximized;
        this.MinimumSize = new Size(1024, 768);
        this.StartPosition = FormStartPosition.CenterScreen;

        // Initialize WebView2 control
        _webView = new WebView2();
        _webView.Dock = DockStyle.Fill;
        this.Controls.Add(_webView);

        try
        {
            // Wait for CoreWebView2 environment initialization
            await _webView.EnsureCoreWebView2Async(null);
            
            // Set User-Agent to identify as PC Desktop Client
            _webView.CoreWebView2.Settings.UserAgent = "SchoolConnectPC/1.0";
            
            // Navigate to the deployed portal
            _webView.Source = new Uri("https://school-connect-pi.vercel.app");
        }
        catch (Exception ex)
        {
            MessageBox.Show($"Failed to initialize WebView2: {ex.Message}\n\nPlease ensure you have the Microsoft Edge WebView2 Runtime installed.", "Initialization Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }
}
