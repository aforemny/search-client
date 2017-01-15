/**
 * Ordering algorithm options. Allowed values: "Date", "Relevance"
 * @default "Date"
 * @enum {number}
 */
enum Order{
    /**
     * Order results by date, newest first.
     */
    Date,
    /**
     * Order results by Relevance, highest first.
     */
    Relevance
}

export default Order;