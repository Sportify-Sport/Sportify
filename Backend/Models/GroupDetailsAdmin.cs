namespace Backend.Models
{
    public class GroupDetailsAdmin
    {
        public int GroupId { get; set; }
        public string GroupName { get; set; }
        public string Description { get; set; }
        public int SportId { get; set; }
        public string GroupImage { get; set; }
        public int CityId { get; set; }
        public DateTime FoundedAt { get; set; }
        public int MaxMemNum { get; set; }
        public int TotalMembers { get; set; }
        public int MinAge { get; set; }
        public string Gender { get; set; }
        public int? GroupAdminId { get; set; }
        public string GroupAdminName { get; set; }
    }
}
