namespace Backend.Models
{
    public class CreateGroupDto
    {
        public string GroupName { get; set; }
        public string Description { get; set; }
        public int SportId { get; set; }
        public int CityId { get; set; }
        public int MaxMemNum { get; set; }
        public int MinAge { get; set; }
        public string Gender { get; set; }
        public int AdminId { get; set; }
    }
}
