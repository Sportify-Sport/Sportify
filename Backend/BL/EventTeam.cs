namespace Backend.BL
{
    public class EventTeam
    {
        private int eventId;
        private int groupId;
        private int scoreNum;

        public EventTeam() { }
        public EventTeam(int eventId, int groupId, int scoreNum)
        {
            this.EventId = eventId;
            this.GroupId = groupId;
            this.ScoreNum = scoreNum;
        }

        public int EventId { get => eventId; set => eventId = value; }
        public int GroupId { get => groupId; set => groupId = value; }
        public int ScoreNum { get => scoreNum; set => scoreNum = value; }
    }
}
