export type Angles = {
    roll: number,
    pitch: number,
    yaw: number
}

export type StartEndAngles = {
    start: Angles,
    end: Angles
};

export enum StartEnd {
    Start = 'start',
    End = 'end'
}

export enum RollPitchYaw {
    Roll = 'roll',
    Pitch = 'pitch',
    Yaw = 'yaw'
}

export type Angle = {
    se: StartEnd,
    rpy: RollPitchYaw
}
