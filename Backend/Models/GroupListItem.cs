namespace Backend.Models
{
    public class GroupListItem
    {
        public int GroupId { get; set; }
        public string GroupName { get; set; }
        public int SportId { get; set; }
        public string GroupImage { get; set; }
        public int CityId { get; set; }
        public DateTime FoundedAt { get; set; }
        public string Gender { get; set; }
        public int TotalMembers { get; set; }
    }
}
