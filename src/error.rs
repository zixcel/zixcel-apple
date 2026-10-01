use std::fmt;

/// First configuration or planning boundary violation.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ConnectorError {
    pub field: &'static str,
    pub message: &'static str,
}

impl ConnectorError {
    pub(crate) const fn new(field: &'static str, message: &'static str) -> Self {
        Self { field, message }
    }
}

impl fmt::Display for ConnectorError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(formatter, "{}: {}", self.field, self.message)
    }
}

impl std::error::Error for ConnectorError {}
