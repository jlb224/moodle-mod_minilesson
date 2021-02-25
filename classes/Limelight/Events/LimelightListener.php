<?php

 namespace mod_minilesson\Limelight\Events;

interface LimelightListener
{
    /**
     * Respond to event.
     *
     * @param object $payload
     */
    public function handle($payload);
}
