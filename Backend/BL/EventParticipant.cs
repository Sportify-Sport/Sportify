namespace Backend.BL
{
    public class EventParticipant
    {
        private int userId;
        private int eventId;
        private bool playWatch;

        public EventParticipant() { }
        public EventParticipant(int userId, int eventId, bool playWatch)
        {
            this.UserId = userId;
            this.EventId = eventId;
            this.PlayWatch = playWatch;
        }

        public int UserId { get => userId; set => userId = value; }
        public int EventId { get => eventId; set => eventId = value; }
        public bool PlayWatch { get => playWatch; set => playWatch = value; }
    }
}
