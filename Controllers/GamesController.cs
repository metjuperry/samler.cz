using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace samler.cz.Controllers
{
    public class GamesController : Controller
    {
        private const string talxisUrl = "~/games/talxis.html";
        private readonly ILogger<HomeController> _logger;

        public GamesController(ILogger<HomeController> logger)
        {
            _logger = logger;
        }

        public IActionResult Index()
        {
            return View();
        }

        public IActionResult Talxis()
        {
            return Redirect(talxisUrl);
        }


    }
}
